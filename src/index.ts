import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/post`, async (req, res) => {
  //create a new post and associate it with an author
  const { title, content, authorEmail } = req.body;
  try {
    const result = await prisma.post.create({
      data: {
        title: title,
        content: content,
        author: {
          connect: {
            email: authorEmail,
          },
        },
      },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.put("/post/:id/views", async (req, res) => {
  const { id } = req.params;
  //update the view count field for a specific post
  try {
    const post = await prisma.post.update({
      where: {id : Number(id) },
      data: {
        viewCount: { 
          increment: 1
        }
      },
    });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.put("/publish/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the post by its ID from the database
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    // If the post was not found, send a 404 response
    if (!post) {
      return res.status(404).json({ error: `Post with ID ${id} does not exist in the database` });
    }

    // Toggle the `published` field on the specified post
    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { published: !post.published },
    });

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the post' });
  }
});

app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete the post by its ID from the database
    const post = await prisma.post.delete({
      where: {
        id: Number(id)
      }
    });
    // Send the deleted post as a JSON response
    res.json(post);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ error: 'An error occurred while deleting the post' });
  }
});

app.get("/users", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await prisma.user.findMany();
    // Send the fetched users as a JSON response
    res.json(users);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});

app.get("/user/:id/drafts", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch all draft posts for the user from the database
    const drafts = await prisma.post.findMany({
      where: {
        authorId: Number(id),
        published: false
      }
    });
    // Send the fetched drafts as a JSON response
    res.json(drafts);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ error: 'An error occurred while fetching drafts' });
  }
});

app.get(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch the post by its ID from the database
    const post = await prisma.post.findUnique({
      where: {
        id: Number(id)
      }
    });
    // If the post was not found, send a 404 response
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // Send the fetched post as a JSON response
    res.json(post);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ error: 'An error occurred while fetching the post' });
  }
});

app.get("/feed", async (req, res) => {
  const { searchString, skip, take, orderBy } = req.query;
  try {
    // Fetch the posts based on the query parameters from the database
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: String(searchString) || '' } },
          { content: { contains: String(searchString) || '' } }
        ]
      },
      include: {
        author: true
      },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: {
        updatedAt: orderBy === 'desc' ? 'desc' : 'asc'
      }
    });
    // Send the fetched posts as a JSON response
    res.json(posts);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ error: 'An error occurred while fetching the feed' });
  }
});

app.get("/", async (req, res) => {
  res.json({ info: "This is a simple API" });

})

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
