const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const app = express();
const port = 3000;

app.use(express.json());

// Middleware to retrieve data from the third-party API
app.use('/api/blog-stats', async (req, res, next) => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
        headers: {
          'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
        }
      });

    if (response.status === 200) {
      req.blogData = response.data;
      next();
    } else {
      throw new Error('Failed to fetch data from the blog API');
    }
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Middleware for blog analytics
app.use((req, res, next) => {
  try {
    // Calculate analytics
    const totalNumberOfBlogs = req.blogData.length;
    const longestTitle = _.maxBy(req.blogData, blog => blog.title.length);
    const blogsWithPrivacyTitle = _.filter(req.blogData, blog =>
      _.includes(_.toLower(blog.title), 'privacy')
    );
    const uniqueBlogTitles = _.uniqBy(req.blogData, 'title').map(blog => blog.title);

    req.analytics = {
      totalNumberOfBlogs,
      longestTitle: longestTitle ? longestTitle.title : '',
      blogsWithPrivacyTitle: blogsWithPrivacyTitle.length,
      uniqueBlogTitles,
    };

    next();
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Endpoint to retrieve blog analytics
app.get('/api/blog-stats', (req, res) => {
  const {
    totalNumberOfBlogs,
    longestTitle,
    blogsWithPrivacyTitle,
    uniqueBlogTitles,
  } = req.analytics;

  const responseObj = {
    totalNumberOfBlogs,
    longestTitle,
    blogsWithPrivacyTitle,
    uniqueBlogTitles,
  };

  res.json(responseObj);
});

// Endpoint to search for blogs by title
app.get('/api/blog-search', (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "query" is required.' });
    }

    // Search for blogs
    const matchingBlogs = req.blogData.filter(blog =>
      blog.title.toLowerCase().includes(query.toLowerCase())
    );

    res.json(matchingBlogs);
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error

  // Respond with an appropriate error message
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
