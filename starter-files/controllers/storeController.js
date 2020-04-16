// exports.myMiddleWare = (req, res, next) => {
//   req.name = 'Wes';
//   next();
// }
const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    console.log('file type:', file);
    const isPhoto = file.mimetype.startsWith('image/')
    if(isPhoto){
      next(null, true);
    } else {
      next({message: 'That filetype isn\'t allowed!'}, false);
    }
  }
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no file resize
  if(!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written photo to file system
  next();
}
exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

exports.getStores = async (req, res) => {
  // 1. query the database for a list of all stores
  console.log('inside of get stores');
  const stores = await Store.find();
  console.log('stores');
  res.render('stores', { title: 'Stores', stores});
}

exports.getStoreBySlug = async (req, res, next) => {
  // console.log('individual store:', req, res);
  console.log(req.params.id);
  const store = await Store.findOne({slug: req.params.slug});
  if(!store){
    next()
  }
  res.render('store', {title: `Display ${store.name}`, store: store });
}

exports.addStore = (req, res) => {
  res.render('editStore', {title: 'Add Store'});
}


exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to
  leave a review?`)
  res.redirect('/store/${store.slug}');
}

exports.editStore = async (req, res) => {
  // 1. find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  // 3. render out the dit form so the user can update their store
  res.render('editStore', {title: `Edit ${store.name}`, store: store});
}

exports.updateStore = async (req, res) => {
  // find and update the store
  //set the location data to a point
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated ${store.name}`);
  res.redirect(`/stores/${store._id}/edit`);
  // redirect them to the store and tell them it worked
}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag ||  { $exists: true }
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tag', { tags, title: 'Tags', tag, stores })
}
