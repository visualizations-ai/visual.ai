import express, { Express } from 'express';

export const applyBodyParserMiddleware = (app: Express): void => {
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
};
