import { Response } from "express";
import fs from "fs";
import path from "path";

export const sendImageResponse = (res: Response, filepaths: string[]) => {
  if (filepaths.length !== 0) {
    const imagePath = path.resolve(filepaths[0]);
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        res.status(500).json({ error: "Failed to read image" });
      } else {
        res.set("Content-Type", "image/png");
        res.send(data);
      }
    });
  } else {
    res.status(500).json({ error: "Failed to find image" });
  }
};
