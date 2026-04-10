import { buildApp } from './bootstrap';
import { environment } from './config/env';

const PORT = environment.PORT;

const app = buildApp();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
