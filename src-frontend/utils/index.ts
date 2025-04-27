export const formatNumber = (
  x: number,
  unit: string = '',
  power: number = 1000,
) => {
  if (x < power) {
    return `${x}${unit}`;
  } else if (x < Math.pow(power, 2)) {
    return `${(x / power).toFixed(1)}K${unit}`;
  } else if (x < Math.pow(power, 3)) {
    return `${(x / Math.pow(power, 2)).toFixed(1)}M${unit}`;
  } else if (x < Math.pow(power, 4)) {
    return `${(x / Math.pow(power, 3)).toFixed(1)}G${unit}`;
  } else {
    return `${(x / Math.pow(power, 3)).toFixed(1)}T${unit}`;
  }
};
