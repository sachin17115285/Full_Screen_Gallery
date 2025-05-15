export const clampScale = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value))
}

export const getScaleFromDimensions = (width: number, height: number) => {
  // TODO: MAKE SMARTER CHOICE BASED ON AVAILABLE FREE VERTICAL SPACE
  return width > height ? width / height * 0.8 : height / width * 0.8
}

// import { MAX_SCALE, MIN_SCALE } from './constants';

// export const clampScale = (
//   scale: number,
//   minScale: number = MIN_SCALE,
//   maxScale: number = MAX_SCALE
// ): number => {
//   'worklet';
//   return Math.min(Math.max(scale, minScale), maxScale);
// };

// export const getScaleFromDimensions = (width: number, height: number): number => {
//   'worklet';
//   const aspectRatio = width / height;
//   if (aspectRatio > 1) {
//     return Math.min(2, MAX_SCALE);
//   }
//   return Math.min(2.5, MAX_SCALE);
// }; 