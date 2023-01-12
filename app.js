//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const lodash = require('lodash');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



// ******************************create a db*********************************
mongoose.set('strictQuery',false);
mongoose.connect("mongodb+srv://admin-george:test123@cluster0.7ymppkt.mongodb.net/todolistDB",{ useNewUrlParser: true }, function (err) { 
    if (err) throw err; console.log('Successfully connected'); });


const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item",itemSchema);

// ***************************************************************


// ****************************initialise the default items***********************************
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3]


// ***************************************************************


//new documents for new lists
const listSchema ={
  name: String,
  items:[itemSchema]
};

const List = mongoose.model("List",listSchema);






app.get("/", function(req, res) {

  // ******************************Find items*********************************
  Item.find(function(err,foundItems){


    // ******************************insert default items in the db*********************************
    if (foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if (err){
          console.log(err);
        }else{
          console.log("Succesfully added.");
        }
      });
      // ***************************************************************
      //redirect to refresh when the default items are added
      res.redirect("/")
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

    
    });
});

app.post("/", function(req, res){

  // ******************************insert new item in th db*********************************
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName ==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save()
      res.redirect("/"+listName)
    });
  }
  
// ***************************************************************

});



app.post("/delete", function(req, res){
  const checkedItemId =req.body.checkbox;
  const listName = req.body.listName
// ******************************delete item of the db*********************************

if (listName==="Today"){
  Item.findByIdAndRemove(checkedItemId,function(err){
    if (!err){
      console.log("succefully deleted checked item.");
      res.redirect("/");
    }
  });
}else{
  List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundlist){
    if(!err){
      res.redirect("/"+listName);
    }
  });
}



  // ***************************************************************
});



app.get("/:listName", function(req,res){
  const customListName = lodash.capitalize(req.params.listName);

  List.findOne({name:customListName},function(err,foundList){
    if (!err){
      if (!foundList){
        //create a new list
        const list = new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName)
      }else{
       //show an existing list
       res.render("list",{listTitle: customListName, newListItems:foundList.items});
      }
    }
  });
  
 

  

});




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
