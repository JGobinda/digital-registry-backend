const mongoose = require("mongoose");

const registryEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["business", "property", "vehicle", "person", "asset", "other"],
        message: "Category must be one of: business, property, vehicle, person, asset, other",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    issuedDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "expired"],
      default: "pending",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// Index for fast searches
registryEntrySchema.index({ title: "text", description: "text" });
registryEntrySchema.index({ category: 1, status: 1 });
registryEntrySchema.index({ createdBy: 1 });
registryEntrySchema.index({ registrationNumber: 1 }, { sparse: true });

// Virtual: isExpired
registryEntrySchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Soft-delete query helper — automatically exclude deleted docs
registryEntrySchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model("RegistryEntry", registryEntrySchema);
