import express, { Request, Response } from 'express';
import cors from 'cors';
import open from 'open';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('pong');
});

const server = app.listen(0, async () => {
  const addressInfo = server.address();
  if (typeof addressInfo === 'object' && addressInfo !== null) {
    const url = `http://localhost:${addressInfo.port}`;
    console.log(`Server is running at ${url} yay we did it!`);
    try {
      await open(url);
    } catch (error) {
      console.error('Failed to open browser:', error);
    }
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
  server.close(() => process.exit(1));

});




