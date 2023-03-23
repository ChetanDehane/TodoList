const express = require("express");
const bodyParser = require("body-parser");
const { Schema } = require("mongoose");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();



app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-chetan:LYm9BmdGqs5pG3Xl@cluster0.s1nr6vc.mongodb.net/todolistDB").then(() => console.log('MongoDb database Connected!')).catch(error => console.log(error.reason));

const itemsSchema = new Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your today list."
});

const item2 = new Item({
    name: "Hit the + button to add item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultToDoItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
    
    const dateTime = date.getDate();
    await Item.find({}).then(async (toDoItems) => {
        if (toDoItems.length === 0){
            await Item.insertMany(defaultToDoItems).then(() => console.log('Inserted!')).catch(error => console.log(error.reason));
            res.redirect("/");
        } else{
            res.render("list", { listTitle: "Today", newListItems: toDoItems, dateTime: dateTime });
        }}).catch(error => console.log(error.reason));
});


app.get("/:customListName", async function (req, res) {  
    const customListName = _.capitalize(req.params.customListName);

    await List.findOne({name: customListName}).then((foundList) =>{
        if (foundList){
            res.render("list", { listTitle: customListName, newListItems: foundList.items });
        }else{
            const list = new List({
                name: customListName,
                items: defaultToDoItems
            });
            list.save();
            res.redirect("/" + customListName);
        }
    }).catch(error => console.log(error.reason));
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if(listName  === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}).then((foundList) =>{
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(error => console.log(error.reason));
    } 
});

app.post("/delete", async function(req, res){
    const deleteItemId = req.body.deleteItem;
    const listName = req.body.listName;

    if(listName === "Today"){
        await Item.findOneAndRemove({_id: deleteItemId}).then(item => {
            console.log('Deleted!'); 
        res.redirect("/")}).catch(error => console.log(error.reason));
    } else {
        await List.findOneAndUpdate({name: listName}, {
            $pull: {items: {_id: deleteItemId}}}).then((results) => {
                res.redirect("/" +  listName);
                console.log('Deleted!');
            }).catch(error => console.log(error.reason));
    }
});

app.listen(3000, function () {
    console.log("Server Started on port 3000");
});