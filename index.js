const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser")
let mongoose = require("mongoose")
const mySecret = process.env['MONGO_URI']
const Schema = mongoose.Schema

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("Connection established!")
})


let userSchema = new mongoose.Schema({
  username: { required: true, type: String },
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//CREATES USERNAME
app.post("/api/users", (req, res) => {
  var name = req.body.username
  let username = new User({ username: name })
  username.save()
    .then((data) => {
      res.json({
        username: data.username,
        _id: data.id
      })
    })
    .catch((err) => {
      console.log(err)
    })
})

//SHOW A LIST OF USERNAMES
app.get("/api/users", async (req, res) => {
  try {
    const allUsers = await User.find({})
      .select({ __v: 0, log: 0 })
    res.json(allUsers)
  }
  catch (err) {
    console.log(err)
  }
})

//POST to excercises 
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {

    var id = req.params._id
    var description = req.body.description
    var duration = +req.body.duration
    // var date = new Date(req.body.date)
    var date = req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString()
    if (description === '' || duration === '') {
      res.json({ error: "needs description and duration" })
      console.log("description or duration error")
      return
    }
    //need code to put in todays date if date is empty
    //  if(date === ""){
    //    date = new Date()
    //     }
    //    else{
    //   date = new Date(date)
    //      }
    //    date = date.toDateString() 
    //need code for confirming id is real
    const idTest = await User.findById(req.params._id)
    if (idTest) {
      //need code to save the data
      idTest.log.push({
        description: description,
        duration: duration,
        date: date
      }
      );

      idTest.save()
        .then((data) => {
          let obj = {
            username: data.username,
            description: req.body.description,
            duration: +req.body.duration,
            _id: data._id,
            date: date
          }
          res.json(obj)
        })
    }
  }
  catch (err) {
    res.json({ error: "ID doesn't exist" });
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    var id = req.params._id
    let from = req.query.from || new Date(0)
    let to = req.query.to || new Date(Date.now())
    let limit = +req.query.limit || 10000;
    from = new Date(from)
    to = new Date(to)
    let findById = await User.findById(req.params._id)
    let logs = findById.log.filter(z => z.date >= from && z.date <= to)
      .map(z => (
        {
          description: z.description,
          duration: +z.duration,
          date: new Date(z.date).toDateString()
        }))
      .slice(0, limit);

    //let limitN = limit
    //let length = logs.length

    // MAY NOT NEED THIS
    let final = {
      "_id": id,
      "username": findById.username,
      "count": +logs.length,
      "log": logs
    };
    res.json(final)

  }


  //console.log(logs)
  //   res.json({logs})
  catch (err) {
    console.log("err")
  }
})

