import mongoose from 'mongoose';

export const ROLES = Object.freeze({
  PRESIDENT: 'president',
  RESIDENT: 'resident',
});

// none: aún no pertenece a ninguna comunidad (recién registrado).
// pending: ha solicitado una vivienda y espera la validación del presidente.
// validated: el presidente ha validado su vinculación.
export const MEMBERSHIP_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo no válido'],
    },
    // Nunca se devuelve en las consultas salvo que se pida con .select('+passwordHash').
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.RESIDENT,
    },
    // Ambos son null hasta que el usuario crea una comunidad o se une a una.
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    dwellingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dwelling',
      default: null,
    },
    membershipStatus: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.NONE,
    },
    // Fecha en la que el usuario eliminó su cuenta (RGPD). Sus datos personales se
    // anonimizan, pero el documento se conserva para no romper las referencias.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// Listados del presidente: residentes de su comunidad filtrados por estado.
userSchema.index({ communityId: 1, membershipStatus: 1 });
// Las cuentas sin vivienda (null) quedan fuera del índice.
userSchema.index(
  { dwellingId: 1 },
  {
    unique: true,
    partialFilterExpression: { dwellingId: { $type: 'objectId' } },
  },
);

export const User = mongoose.model('User', userSchema);