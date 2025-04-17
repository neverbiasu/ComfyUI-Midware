import { Response } from "express";

export const sendTextResponse = (res: Response, text: string) => {
  if (text) {
    res.set("Content-Type", "text/plain");
    res.send(text);
  } else {
    res.status(500).json({ error: "Failed to find text" });
  }
};
