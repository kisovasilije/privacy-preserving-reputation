#!/usr/bin/env python3
"""Run all trusted-authority instances from separate environment files."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time


PROJECT_ROOT = Path(__file__).resolve().parent.parent
INSTANCE_FILES = (
    ("Trusted Authority 1", PROJECT_ROOT / ".env.ta1"),
    ("Trusted Authority 2", PROJECT_ROOT / ".env.ta2"),
    ("Trusted Authority 3", PROJECT_ROOT / ".env.ta3"),
)
REQUIRED_KEYS = ("DATABASE_URL", "PORT")


def read_env_file(path: Path) -> dict[str, str]:
    if not path.is_file():
        raise ValueError(
            f"Missing {path.name}. Copy {path.name}.example to {path.name} first."
        )

    values: dict[str, str] = {}
    for line_number, raw_line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            raise ValueError(f"{path.name}:{line_number} is not a KEY=VALUE entry.")

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key] = value

    missing = [key for key in REQUIRED_KEYS if not values.get(key)]
    if missing:
        raise ValueError(f"{path.name} is missing: {', '.join(missing)}.")

    try:
        port = int(values["PORT"])
    except ValueError as error:
        raise ValueError(f"{path.name}: PORT must be an integer.") from error
    if not 1 <= port <= 65_535:
        raise ValueError(f"{path.name}: PORT must be between 1 and 65535.")

    return values


def load_instances(mode: str) -> list[tuple[str, Path, dict[str, str]]]:
    instances: list[tuple[str, Path, dict[str, str]]] = []
    for name, path in INSTANCE_FILES:
        values = read_env_file(path)
        values["NODE_ENV"] = "production" if mode == "production" else "development"
        instances.append((name, path, values))

    ports = [values["PORT"] for _, _, values in instances]
    urls = [values["DATABASE_URL"] for _, _, values in instances]
    if len(set(ports)) != len(ports):
        raise ValueError("Every instance must use a different PORT.")
    if len(set(urls)) != len(urls):
        raise ValueError("Every instance must use a different DATABASE_URL.")

    return instances


def npm_executable() -> str:
    executable = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if executable is None:
        raise ValueError("npm was not found on PATH.")
    return executable


def instance_environment(values: dict[str, str]) -> dict[str, str]:
    environment = os.environ.copy()
    environment.update(values)
    return environment


def apply_migrations(
    npm: str, instances: list[tuple[str, Path, dict[str, str]]]
) -> None:
    for name, path, values in instances:
        print(f"Applying migrations for {name} using {path.name}...", flush=True)
        subprocess.run(
            [npm, "run", "migrate:deploy"],
            cwd=PROJECT_ROOT,
            env=instance_environment(values),
            check=True,
        )


def stop_processes(processes: list[subprocess.Popen[bytes]]) -> None:
    running = [process for process in processes if process.poll() is None]
    for process in running:
        try:
            if os.name == "nt":
                process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                os.killpg(process.pid, signal.SIGTERM)
        except (OSError, ProcessLookupError):
            process.terminate()

    deadline = time.monotonic() + 10
    while running and time.monotonic() < deadline:
        running = [process for process in running if process.poll() is None]
        time.sleep(0.1)

    for process in running:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass


def run_instances(
    npm: str,
    mode: str,
    instances: list[tuple[str, Path, dict[str, str]]],
) -> int:
    command = [npm, "run", "dev"] if mode == "development" else [npm, "start"]
    processes: list[subprocess.Popen[bytes]] = []

    try:
        for name, path, values in instances:
            kwargs: dict[str, object] = {}
            if os.name == "nt":
                kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
            else:
                kwargs["start_new_session"] = True

            print(
                f"Starting {name} on port {values['PORT']} using {path.name}...",
                flush=True,
            )
            process = subprocess.Popen(
                command,
                cwd=PROJECT_ROOT,
                env=instance_environment(values),
                **kwargs,
            )
            processes.append(process)

        print("All three instances started. Press Ctrl+C to stop them.", flush=True)
        while True:
            for process in processes:
                exit_code = process.poll()
                if exit_code is not None:
                    print(
                        f"An instance exited with status {exit_code}; stopping the others.",
                        file=sys.stderr,
                    )
                    return exit_code or 1
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping all instances...", flush=True)
        return 0
    finally:
        stop_processes(processes)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mode",
        choices=("development", "production"),
        default="development",
        help="Run npm run dev or the compiled production server.",
    )
    parser.add_argument(
        "--migrate",
        action="store_true",
        help="Apply committed migrations to all three databases before starting.",
    )
    arguments = parser.parse_args()

    try:
        instances = load_instances(arguments.mode)
        npm = npm_executable()
        if arguments.mode == "production" and not (
            PROJECT_ROOT / "dist" / "server.js"
        ).is_file():
            raise ValueError("Production build is missing. Run npm run build first.")
        if arguments.migrate:
            apply_migrations(npm, instances)
        return run_instances(npm, arguments.mode, instances)
    except (ValueError, subprocess.CalledProcessError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

