export enum STEPS {
  GOOD = 0,
  WARNING = 1,
  BAD = 2,
}
export const colors = {
  [STEPS.GOOD]: { from: "green", to: "teal" },
  [STEPS.WARNING]: { from: "yellow", to: "orange" },
  [STEPS.BAD]: { from: "red", to: "pink" },
}
