const request = require("supertest");
const { MongoClient, ObjectId } = require("mongodb");
const app = require("../index");

let connection;
let db;

beforeAll(async () => {
  connection = await MongoClient.connect(
    "mongodb+srv://admin:admin@cluster0.uj5gh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );

  db = connection.db("usersdb");
});

afterAll(async () => {
  await connection.close();
});

describe("User API", () => {
  let userId;

  test("should create a user", async () => {
    const res = await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" })
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("John Doe");
    expect(res.body.email).toBe("john@example.com");

    userId = res.body._id;
  });

  test("should fetch all users", async () => {
    const res = await request(app).get("/users");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("should update a user", async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .send({ name: "Jane Doe" });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Jane Doe");
  });

  test("should return 404 when updating a non-existing user", async () => {
    const fakeId = new ObjectId().toString();
    const res = await request(app)
      .put(`/users/${fakeId}`)
      .send({ name: "Does Not Exist" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
