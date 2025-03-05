// Import required modules
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const authenticate = require("../middlewares/authenticate");
const User = require("../model/userModel");
const ServiceDetails = require("../model/ServiceDetails");
const Car = require("../model/Car");

const s3 = new S3Client({
  region: "ap-south-1",
  endpoint: "https://s3.ap-south-1.amazonaws.com",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// API endpoint for file upload
// router.post(
//   "/add",
//   authenticate,
//   upload.array("pre_service_photos"),
//   async (req, res) => {
//     try {
//       const { model, registration_number, color, year } = req.body;
//       const user = await User.findById(req.user._id);

//       if (!user) return res.status(404).json({ error: "User not found" });

//       // Check if the car already exists
//       let car = await Car.findOne({ registration_number });

//       if (!car) {
//         // Create a new car if it does not exist
//         car = new Car({
//           owner_id: user._id,
//           model,
//           registration_number,
//           color,
//           year,
//         });
//         await car.save();
//       }
//       console.log(req.body);

//       const photos = req.body.pre_service_photos.map((file) => ({
//         filename: file.originalname,
//         url: file.location,
//       }));

//       const serviceDetails = new ServiceDetails({
//         user_id: user._id,
//         car_id: car._id,
//         pre_service_photos: photos, // Store as pre-service photos
//       });

//       await serviceDetails.save();

//       return res.status(201).json({ success: true, serviceDetails });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({
//         error:
//           error.message ||
//           "An error occurred while uploading the service details",
//       });
//     }
//   }
// );

router.post("/", authenticate, async (req, res) => {
  try {
    const {
      model,
      registration_number,
      color,
      year,
      user_id,
      username,
      pre_service_photos,
    } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ error: "User not found" });

    let car = await Car.findOne({ registration_number });

    if (!car) {
      car = new Car({
        owner_id: user_id,
        model,
        registration_number,
        color,
        year,
      });
      await car.save();
    }

    const serviceDetails = new ServiceDetails({
      user_id,
      username,
      car_id: car._id,
      pre_service_photos,
      work_status: user.role === "admin" ? "in_progress" : "pending",
    });

    await serviceDetails.save();

    return res.status(201).json({ success: true, serviceDetails });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        error.message ||
        "An error occurred while uploading the service details",
    });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const {
      username,
      model,
      color,
      search,
      work_status,
      registration_number,
      year,
    } = req.query;

    const query = {};
    const filterConditions = []; // Conditions for ServiceDetails fields

    // Parse comma-separated values
    const parseQuery = (val) =>
      val ? (Array.isArray(val) ? val : val.split(",")) : undefined;

    if (username) {
      query.username = { $in: parseQuery(username) };
    }
    if (work_status) {
      query.work_status = { $in: parseQuery(work_status) };
    }

    // If no search, you can also add Car filters based on query parameters (if needed)
    let carIdsFromFilters = [];
    if (model || color || registration_number || year) {
      const carFilter = {};
      if (model) carFilter.model = { $in: parseQuery(model) };
      if (color) carFilter.color = { $in: parseQuery(color) };
      if (registration_number)
        carFilter.registration_number = {
          $in: parseQuery(registration_number),
        };
      if (year) carFilter.year = { $in: parseQuery(year).map(Number) };

      const matchingCars = await Car.find(carFilter, { _id: 1 });
      carIdsFromFilters = matchingCars.map((car) => car._id);
      if (carIdsFromFilters.length) {
        filterConditions.push({ car_id: { $in: carIdsFromFilters } });
      }
    }

    // Handle search across both ServiceDetails and Car fields
    if (search && search.trim() !== "") {
      // Conditions for ServiceDetails fields:
      const serviceSearchConditions = [
        { username: { $regex: search, $options: "i" } },
        { work_status: { $regex: search, $options: "i" } },
      ];

      // Lookup users by phone
      const users = await User.find(
        { phone: { $regex: search, $options: "i" } },
        { _id: 1 }
      );
      const userIds = users.map((user) => user._id);
      if (userIds.length) {
        serviceSearchConditions.push({ user_id: { $in: userIds } });
      }

      // Prepare Car search conditions:
      let carSearchFilter = {};
      if (!isNaN(Number(search))) {
        carSearchFilter = {
          $or: [
            { model: { $regex: search, $options: "i" } },
            { color: { $regex: search, $options: "i" } },
            { registration_number: { $regex: search, $options: "i" } },
            { year: Number(search) },
          ],
        };
      } else {
        carSearchFilter = {
          $or: [
            { model: { $regex: search, $options: "i" } },
            { color: { $regex: search, $options: "i" } },
            { registration_number: { $regex: search, $options: "i" } },
          ],
        };
      }

      // Query Car collection with the search filter
      const matchingCars = await Car.find(carSearchFilter, { _id: 1 });
      const carSearchIds = matchingCars.map((car) => car._id);

      // Combine all search conditions
      filterConditions.push(...serviceSearchConditions, {
        car_id: { $in: carSearchIds },
      });

      // Use $or to match any search condition
      query.$or = filterConditions;
    } else if (filterConditions.length) {
      query.$and = filterConditions;
    }

    // Debug logs for your query
    console.log("Final ServiceDetails Query:", JSON.stringify(query, null, 2));

    // Query ServiceDetails
    const serviceDetails = await ServiceDetails.find(query)
      .populate("user_id")
      .populate("car_id");

    // Transform response: rename user_id to user_details and car_id to car_details
    const transformedServiceDetails = serviceDetails
      .map((service) => {
        const serviceObject = service.toObject();
        return {
          ...serviceObject,
          user_details: serviceObject.user_id,
          car_details: serviceObject.car_id,
        };
      })
      .map(({ user_id, car_id, ...rest }) => rest);

    return res.status(200).json({
      success: true,
      serviceDetails: transformedServiceDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        error.message || "An error occurred while fetching service details",
    });
  }
});

router.get("/myservices", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { model, color, year, search, work_status, registration_number } =
      req.query;

    const query = { user_id: userId };
    const filterConditions = [];

    const parseQuery = (val) =>
      val ? (Array.isArray(val) ? val : val.split(",")) : undefined;

    if (work_status) {
      query.work_status = { $in: parseQuery(work_status) };
    }

    let carIdsFromFilters = [];
    if (model || color || registration_number || year) {
      const carFilter = {};
      if (model) carFilter.model = { $in: parseQuery(model) };
      if (color) carFilter.color = { $in: parseQuery(color) };
      if (registration_number)
        carFilter.registration_number = {
          $in: parseQuery(registration_number),
        };
      if (year) carFilter.year = { $in: parseQuery(year).map(Number) };

      const matchingCars = await Car.find(carFilter, { _id: 1 });
      carIdsFromFilters = matchingCars.map((car) => car._id);
      if (carIdsFromFilters.length) {
        filterConditions.push({ car_id: { $in: carIdsFromFilters } });
      }
    }

    if (search && search.trim() !== "") {
      const serviceSearchConditions = [
        { work_status: { $regex: search, $options: "i" } },
      ];

      const users = await User.find(
        { phone: { $regex: search, $options: "i" } },
        { _id: 1 }
      );
      const userIds = users.map((user) => user._id);
      if (userIds.length) {
        serviceSearchConditions.push({ user_id: { $in: userIds } });
      }

      let carSearchFilter = {};
      if (!isNaN(Number(search))) {
        carSearchFilter = {
          $or: [
            { model: { $regex: search, $options: "i" } },
            { color: { $regex: search, $options: "i" } },
            { registration_number: { $regex: search, $options: "i" } },
            { year: Number(search) },
          ],
        };
      } else {
        carSearchFilter = {
          $or: [
            { model: { $regex: search, $options: "i" } },
            { color: { $regex: search, $options: "i" } },
            { registration_number: { $regex: search, $options: "i" } },
          ],
        };
      }

      const matchingCars = await Car.find(carSearchFilter, { _id: 1 });
      const carSearchIds = matchingCars.map((car) => car._id);
      filterConditions.push(...serviceSearchConditions, {
        car_id: { $in: carSearchIds },
      });

      query.$or = filterConditions;
    } else if (filterConditions.length) {
      query.$and = filterConditions;
    }

    console.log("Final myservices Query:", JSON.stringify(query, null, 2));

    const serviceDetails = await ServiceDetails.find(query)
      .populate("user_id")
      .populate("car_id");

    const transformedServiceDetails = serviceDetails
      .map((service) => {
        const serviceObject = service.toObject();
        return {
          ...serviceObject,
          user_details: serviceObject.user_id,
          car_details: serviceObject.car_id,
        };
      })
      .map(({ user_id, car_id, ...rest }) => rest);

    return res.status(200).json({
      success: true,
      serviceDetails: transformedServiceDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        error.message || "An error occurred while retrieving service details",
    });
  }
});

router.get("/filter-options", authenticate, async (req, res) => {
  try {
    // Fetch unique values for each field

    const usernames = await ServiceDetails.distinct("username");
    const years = await Car.distinct("year");
    const models = await Car.distinct("model");
    const registration_numbers = await Car.distinct("registration_number");
    const colors = await Car.distinct("color");

    // Send the response
    return res.status(200).json({
      success: true,
      filterOptions: {
        years,
        usernames,
        models,
        registration_numbers,
        colors,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "An error occurred while fetching filter options",
    });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      model,
      registration_number,
      color,
      year,
      user_id,
      username,
      pre_service_photos,
    } = req.body;

    const serviceId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let serviceDetails = await ServiceDetails.findById(serviceId);
    if (!serviceDetails)
      return res.status(404).json({ error: "Service not found" });

    // Check if car exists or update it
    let car = await Car.findOne({ registration_number });

    if (!car) {
      car = new Car({
        owner_id: user_id,
        model,
        registration_number,
        color,
        year,
      });
      await car.save();
    } else {
      // Update car details if it already exists
      await Car.findByIdAndUpdate(car._id, {
        model,
        color,
        year,
      });
    }

    // Update service details
    serviceDetails.user_id = user_id;
    serviceDetails.username = username;
    serviceDetails.car_id = car._id;
    serviceDetails.pre_service_photos = pre_service_photos;
    serviceDetails.work_status =
      user.role === "admin" ? "in_progress" : "pending";

    await serviceDetails.save();

    return res.status(200).json({ success: true, serviceDetails });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        error.message || "An error occurred while updating the service details",
    });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    let serviceDetails = await ServiceDetails.findById(req.params.id)
      .populate("user_id")
      .populate("car_id");

    if (!serviceDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Service details not found" });
    }

    // Convert Mongoose document to a plain JavaScript object
    let serviceDetailsObj = serviceDetails.toObject();

    // Assign new properties
    serviceDetailsObj.user_details = serviceDetailsObj.user_id;
    serviceDetailsObj.car_details = serviceDetailsObj.car_id;

    // Remove old properties
    delete serviceDetailsObj.user_id;
    delete serviceDetailsObj.car_id;

    return res
      .status(200)
      .json({ success: true, serviceDetails: serviceDetailsObj });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving service details",
    });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const serviceDetails = await ServiceDetails.findByIdAndDelete(req.params.id)
      .lean()
      .exec();
    return res
      .status(200)
      .send({ success: true, serviceDetails: serviceDetails });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while deleting service details",
    });
  }
});

router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { work_status, post_service_photos } = req.body;

    // Check if at least one field is provided
    if (!work_status && !post_service_photos) {
      return res.status(400).json({
        error: "Please provide at least one field to update.",
      });
    }

    // Find the existing service request
    const serviceDetails = await ServiceDetails.findById(req.params.id);
    if (!serviceDetails) {
      return res.status(404).json({ error: "Service request not found" });
    }

    // Update fields if provided
    if (work_status) {
      if (
        !["pending", "in_progress", "completed", "rejected"].includes(
          work_status
        )
      ) {
        return res.status(400).json({ error: "Invalid work status" });
      }
      serviceDetails.work_status = work_status;
    }

    if (post_service_photos && Array.isArray(post_service_photos)) {
      serviceDetails.post_service_photos = post_service_photos;
    }

    // Save the updated document
    await serviceDetails.save();

    return res.status(200).json({
      success: true,
      message: "Service request updated successfully",
      serviceDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        error.message || "An error occurred while updating the service request",
    });
  }
});

module.exports = router;
