const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const winston = require("winston");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const MONGO_URI =
  "mongodb+srv://admin:admin@cluster0.uj5gh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

app.use(bodyParser.json());

// Connection to mongo DB.
let db;
MongoClient.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((client) => {
    db = client.db("usersdb");
    logger.info("MongoDB connected successfully");
  })
  .catch((err) => logger.error("MongoDB connection error:", err));

// API to get list of users.

app.get("/users", async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    logger.info("Fetching users");
    res.send(users);
  } catch (error) {
    logger.error("Error fetching users:", error);
    res.status(500).send(error);
  }
});

// API to create users.

app.post("/users", async (req, res) => {
  try {
    const result = await db.collection("users").insertOne(req.body);
    const newUser = { _id: result.insertedId, ...req.body };
    logger.info(`User created: ${JSON.stringify(newUser)}`);
    res.status(201).send(newUser);
  } catch (error) {
    logger.error("Error creating user:", error);
    res.status(400).send(error);
  }
});

// API to update a user.

app.put("/users/:id", async (req, res) => {
  try {
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body },
        { returnDocument: "after" }
      );
    if (!result) {
      logger.warn(`User with ID ${req.params.id} not found`);
      return res.status(404).send({ message: "User not found" });
    }
    logger.info(`User updated: ${JSON.stringify(result)}`);
    res.status(200).send(result);
  } catch (error) {
    logger.error("Error updating user:", error);
    res.status(400).send(error);
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
