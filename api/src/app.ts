import 'dotenv/config';
import { buildApp } from './bootstrap';

const PORT = Number(process.env.PORT) || 8080;

const app = buildApp();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
