const express = require('express')
const cors = require("cors");
const app = express()
require('dotenv').config()

app.use(cors());
app.use(express.json());

const port = 5000


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `${process.env.MONGO_URI}`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        // DB COLLECTIONS 
        let userCollection = client.db("Artisan").collection("users");
        let upcomingEvents = client.db("Artisan").collection("upcomingEventsCollection");
        let previousEvents = client.db("Artisan").collection("previousEventsCollection");
        let productsCollection = client.db("Artisan").collection("products");
        let favouritesCollection = client.db("Artisan").collection("favourites");
        let orderCollection = client.db("Artisan").collection("orders");



        // POST USER DATA TO DATABASE WHILE REGISTER 
        app.post("/userRegister", async (req, res) => {
            let user = req.body;
            let result = await userCollection.insertOne(user);
            res.send(result);
        })

        // POST USER DATA WITH GOOGLE LOGIN 
        app.post("/userGoogleRegister", async (req, res) => {
            let userDetails = req.body;
            let checkEmail = userDetails.email;
            let existingUser = await userCollection.findOne({ email: checkEmail });

            if (existingUser) {
                return res.status(409).json({ error: 'Email already exists' });
            }

            let result = await userCollection.insertOne(userDetails);
            res.send(result);
        });

        // GET UPCOMING EVENTS 
        app.get("/getUpcomingEvents", async (req, res) => {
            let result = await upcomingEvents.find().toArray();
            res.send(result);
        })

        // GET PREVIOUS EVENTS 
        app.get("/getPreviousEvents", async (req, res) => {
            let result = await previousEvents.find().toArray();
            res.send(result);
        })

        // API TO GET CURRENT USER DATA 
        app.get("/userData/:email", async (req, res) => {
            let email = req.params.email;
            // console.log(email)
            let query = {
                email: email,
            };
            let result = await userCollection.findOne(query);
            res.send(result);
        });

        // POST PRODUCT DATA 
        app.post("/products", async (req, res) => {
            let productData = req.body;
            let result = await productsCollection.insertOne(productData);
            res.send(result);
        })

        // GET ALL PRODUCTS DATA 
        app.get("/getAllProducts", async (req, res) => {
            try {
                let query = {};
                if (req.query.searchValue) {
                    query.product_name = { $regex: req.query.searchValue, $options: 'i' };
                }
                if (req.query.selectedCategory) {
                    query.product_category = req.query.selectedCategory;
                }
                if (req.query.selectedLocation) {
                    query.product_location = req.query.selectedLocation;
                }
                let result = await productsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching products:", error);
                res.status(500).send("Internal Server Error");
            }
        });


        // API TO GET PRODUCTS ACCORDING TO CURRENT ARTISAN 
        app.get('/getProducts/:currentUserEmail', async (req, res) => {
            let userEmail = req.params.currentUserEmail;
            // console.log(userEmail);
            let result = await productsCollection.find({ artisan_email: userEmail }).toArray();
            res.send(result);
        });

        // API TO DELETE PRODUCT
        app.delete("/deleteProduct/:id", async (req, res) => {
            let id = req.params.id;
            let query = { _id: new ObjectId(id) };
            let result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        // GET PRODUCT DETAILS BY SPECIFIC ID
        app.get("/productDetails/:id", async (req, res) => {
            let id = req.params.id;
            let query = { _id: new ObjectId(id) };
            let result = await productsCollection.findOne(query);
            res.send(result);
        })

        // UPDATE PRODUCT DETAILS 
        app.patch("/updateProduct/:id", async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedProduct = {
                $set: {
                    product_name: product.product_name,
                    product_price: product.product_price,
                    product_category: product.product_category,
                    product_short_description: product.product_short_description,
                    product_broad_description: product.product_broad_description,
                    product_location: product.product_location
                },
            };
            const result = await productsCollection.updateOne(
                filter,
                updatedProduct,
                options
            );
            res.send(result);
        });

        // API TO ADD TO FAVOURITES 
        app.post("/favourites", async (req, res) => {
            let favouritesData = req.body;
            let existingFavourite = await favouritesCollection.findOne({
                productId: favouritesData.productId,
                currentUserEmail: favouritesData.currentUserEmail
            });

            if (existingFavourite) {
                return res.status(400).send({ error: "Favourite already exists." });
            }
            let result = await favouritesCollection.insertOne(favouritesData);
            res.send(result);
        });

        // API TO GET FAVOURITE PRODUCTS FOR PARTICULAR USER 
        app.get("/getFavouriteProducts/:userEmail", async (req, res) => {
            let email = req.params.userEmail
            let query = { currentUserEmail: email };
            let result = await favouritesCollection.find(query).toArray();
            res.send(result);
        })

        // API TO DELETE FAVOURITE 
        app.delete("/deleteFavourites/:id", async (req, res) => {
            let id = req.params.id;
            let query = { _id: new ObjectId(id) };
            let result = await favouritesCollection.deleteOne(query);
            res.send(result);
        })

        // POST ORDER DATA 
        app.post("/addOrder", async (req, res) => {
            let orderDetails = req.body;
            let result = await orderCollection.insertOne(orderDetails);
            res.send(result);
        })

        // API TO GET ORDERS FOR PARTICULAR USER 
        app.get("/getOrdersForUser/:userEmail", async (req, res) => {
            let email = req.params.userEmail
            let query = { client_email: email };
            let result = await orderCollection.find(query).toArray();
            res.send(result);
        })

        // API TO GET ORDERS FOR PARTICULAR ARTISAN 
        app.get("/getOrdersForArtisan/:userEmail", async (req, res) => {
            let email = req.params.userEmail
            let query = { artisan_email: email };
            let result = await orderCollection.find(query).toArray();
            res.send(result);
        })

        // API TO GET MOST RECENT FOUR PRODUCTS 
        app.get("/getMostRecentProducts", async (req, res) => {
            let result = await productsCollection.find().sort({ addedTime: -1 }).limit(4).toArray();
            res.send(result);
        })



        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Artisan Server Running at full Speed!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})