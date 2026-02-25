import { app } from './app.js';

const port = process.env.PORT ?? 5001;

app.listen(port, () => console.log(`Jigger AI server running on port ${port}`));
