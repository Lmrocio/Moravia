import mongoose from 'mongoose';

const dwellingSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'La vivienda debe pertenecer a una comunidad'],
    },
    // Planta: 0 es la planta baja.
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
    // Puerta: A, B, C...
    door: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    // Nombre visible de la vivienda: "Bajo A", "1º B"...
    label: {
      type: String,
      required: [true, 'La vivienda necesita un nombre'],
      trim: true,
      maxlength: 30,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// No puede haber dos viviendas con el mismo nombre en una comunidad.
dwellingSchema.index({ communityId: 1, label: 1 }, { unique: true });

export const Dwelling = mongoose.model('Dwelling', dwellingSchema);