const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config()



//Setting up the database
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
const mongoose = require('mongoose');
const { reset } = require('nodemon');
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/exercise-track', options)


var connection = mongoose.connection
connection.once('open', function() {
    console.log("Logged in to the database succesfully!")
})

connection.on('error', function() {
    console.log("Error while connecting to the database.")
})

// Creating a chema

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        require: true
    }
})

const ExerciseSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        min: 5,
        max: 500,
    },
    duration: {
        type: Number,
        required: true
    },
    cdate: {
        type: String
    }
})

var Exercise = mongoose.model("Exercise", ExerciseSchema)

var User = mongoose.model("User", UserSchema)

// Controller


app.post("/api/exercise/new-user", function(req, res) {
    var userName = req.body.username
    if (!userName) {
        res.send("Make sure you enter you user name.")
    } else {
        try {
            var user = new User({
                username: userName,
            })

            user.save((err, data) => {
                if (err) {
                    res.json({ "Error": err })
                } else {
                    res.json({ "usename": data.username, "id": data._id })
                }
            })

        } catch (err) {
            res.send({ err })
        }


    }
})

app.post('/api/exercise/add', (req, res) => {

    var empUser = "";
    var userId = req.body.userId
    var description = req.body.description
    var duration = req.body.duration
    var nowDate = req.body.date
    if (!userId || !description || !duration || !nowDate) {
        res.send("Make sure that all fields are correct.")
    } else {
        var newDate = new Date(nowDate.toString())
        if (newDate === "Invalid Date") {
            newDate = new Date()
        } else if (newDate === "") {
            newDate = new Date()
        }
        if (isNaN(duration)) {
            res.send("please Enter a number on duration")
        }

        var userWithId = User.find({ _id: userId }, function(err, data) {
            if (err) {
                res.send("The User with Id : ", userId, " doesn't exist")
            } else {
                empUser = data.username

            }
        })

        const monthNames = ["", 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const week = ["", 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        var dateString = `${week[newDate.getDay()]} ${monthNames[newDate.getMonth()]} ${newDate.getMonth()} ${newDate.getFullYear()}`

        var addExercise = new Exercise({
            userId: userId,
            description: description,
            duration: duration,
            cdate: dateString

        })

        addExercise.save((err, data) => {
            if (err) {
                res.send("Error :", err)
            }
            res.json({ "_id": data.userId, "username": empUser, "date": data.cdate, "duration": data.duration, "description": data.description })
        })
    }
})








app.use(cors())



app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
    return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage

    if (err.errors) {
        // mongoose validation error
        errCode = 400 // bad request
        const keys = Object.keys(err.errors)
            // report the first validation error
        errMessage = err.errors[keys[0]].message
    } else {
        // generic or custom error
        errCode = err.status || 500
        errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode).type('txt')
        .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})