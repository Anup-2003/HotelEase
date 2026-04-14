const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig");
const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient =mbxgeocoding({accessToken: mapToken});


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = async (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path: "author",
        },
    }).
     populate("owner");
    if(!listing){
        req.flash("error","Hotel you requested for does not exist");
       return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  })
    .send();
   
    


    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename}
    newListing.geometry =response.body.features[0].geometry;
    let savedlisings = await newListing.save();
  
    req.flash("success", "New Hotel Added!");
    res.redirect("/listings"); // Redirect to new listing page 
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing) {
      req.flash("error", "Hotel not found!");
      return res.redirect("/listings");
  }

  // Track original values
  const originalLocation = listing.location;
  const originalCountry = listing.country;

  // Update basic fields
  Object.assign(listing, req.body.listing);

  // If location or country changed
  if (listing.location !== originalLocation || listing.country !== originalCountry) {
      try {
          const geoResponse = await geocodingClient.forwardGeocode({
              query: `${listing.location}, ${listing.country}`,
              limit: 1
          }).send();

          if (!geoResponse.body.features[0]?.geometry?.type) {
              req.flash("error", "Invalid location data");
              return res.redirect(`/listings/${id}/edit`);
          }

          listing.geometry = geoResponse.body.features[0].geometry;
      } catch (err) {
          console.error("Geocoding failed:", err);
          req.flash("error", "Error validating location");
          return res.redirect(`/listings/${id}/edit`);
      }
  }

  // Rest of your image handling code
  // ...

  await listing.save();
  req.flash("success", "Hotel Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Hotel Removed!");
    res.redirect("/listings");
};