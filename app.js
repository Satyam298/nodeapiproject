const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const app = express();


let blogs = []; // Variable to store fetched blogs data


// Function to fetch blogs data from the API
const fetchBlogs = async () => {
    try {
       // Fetch fresh data from the API
        const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
            headers: {
                'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
            }
        });
            
            blogs = response.data.blogs;
            
        
        // Ensure that the fetched data is an array
        return Array.isArray(blogs) ? blogs : [];
        
    } catch (error) { // Catch any errors
        console.error('Error fetching blogs:', error); // Log any errors
        throw new Error('Error fetching blogs');
    }
};

//memoized the fetchBlogs functin to return cache if it is already fetched
const memoizedFetchBlogs = _.memoize(fetchBlogs);

// Function to analyze blogs and return analytics using lodash
const analyzeBlogs = async () => {
    try {
        const allBlogs = await memoizedFetchBlogs(5); // Fetch blogs data or use cached data
        
        // Implement analytics functionality
        
        const totalBlogs = allBlogs.length;
        const longestBlog = _.maxBy(allBlogs, blog => blog.title.length);
        const blogsWithPrivacy = allBlogs.filter(blog => blog.title.toLowerCase().includes('privacy'));
        //.includes() checks if the query is present in the title
        
        const uniqueBlogTitles = _.uniqBy(allBlogs, 'title');
        return {
            totalBlogs,
            longestBlog: longestBlog.title, 
            blogsWithPrivacy: blogsWithPrivacy.length,
            uniqueBlogTitles: uniqueBlogTitles.map(blog => blog.title) 
            
        };
    } catch (error) { // Catch any errors
        console.error(error);
        throw new Error('Error analyzing blogs');
    }
};

// Middleware to fetch and analyze blog data
app.get('/api/blog-stats', async (req, res) => {
    try {
        const analytics = await analyzeBlogs();
        const formattedJSON = JSON.stringify(analytics,null,4); //stringify converts obj to json string to make results readable
        res.header("Content-Type",'application/json'); //setting header to application/json
        res.send(formattedJSON);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Blog search endpoint
app.get('/api/blog-search', async (req, res) => {
    const query = req.query.query;
    if (!query || typeof query !== 'string') { // Validating the query parameter
        return res.status(400).json({ error: 'Invalid or missing query parameter' }); // Return error response
    }

    try {
        const validBlogs = await memoizedFetchBlogs(5); // Fetch fresh blogs data or use cached data
        // Implement search functionality
        const filteredBlogs = validBlogs.filter(blog => blog.title.toLowerCase().includes(query.toLowerCase()));
        // title and query both are converted to lowercase to make search case insensitive
        //.includes() checks if the query is present in the title
        
        
        const formattedJSON = JSON.stringify(filteredBlogs,null,4); //stringify converts obj to json string to make results readable
        res.header('Content-Type', 'application/json') //setting header to application/json
        res.send(formattedJSON); //sending the response
    } catch (error) {
        console.error(error); // Log any errors
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.listen(3000, () => {                            // Start the server on port 3000
    console.log(`Server is running on port 3000`);
});
