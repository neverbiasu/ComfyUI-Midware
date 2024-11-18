import { Response } from "express";
import path from "path";

export const sendImageResponse = (res: Response, filepaths: string[]) => {
  if (filepaths.length !== 0) {
    const imagePath = path.resolve(filepaths[0]);
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ error: "Failed to send image" });
      }
    });
  } else {
    res.status(500).json({ error: "Failed to find image" });
  }
};
