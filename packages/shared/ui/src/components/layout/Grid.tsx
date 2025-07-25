import React from "react";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | "auto";
  /** Responsive column configuration */
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  };
  /** Gap between grid items */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Align items */
  align?: "start" | "center" | "end" | "stretch";
  /** Justify items */
  justify?: "start" | "center" | "end" | "stretch";
  /** Auto-fit columns */
  autoFit?: boolean;
  /** Minimum column width for auto-fit */
  minColWidth?: string;
  /** Children */
  children?: React.ReactNode;
}

const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
  auto: "grid-cols-auto",
};

const responsiveColClasses = {
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
    6: "sm:grid-cols-6",
    12: "sm:grid-cols-12",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
    12: "md:grid-cols-12",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
    12: "lg:grid-cols-12",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
    12: "xl:grid-cols-12",
  },
};

const gapClasses = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyClasses = {
  start: "justify-items-start",
  center: "justify-items-center",
  end: "justify-items-end",
  stretch: "justify-items-stretch",
};

export const Grid: React.FC<GridProps> = ({
  cols = "auto",
  responsive,
  gap = "md",
  align = "stretch",
  justify = "stretch",
  autoFit = false,
  minColWidth = "250px",
  children,
  className = "",
  style = {},
  ...props
}) => {
  const classes = [
    "grid",
    !autoFit && cols !== "auto" ? colClasses[cols] : "",
    responsive?.sm ? responsiveColClasses.sm[responsive.sm] : "",
    responsive?.md ? responsiveColClasses.md[responsive.md] : "",
    responsive?.lg ? responsiveColClasses.lg[responsive.lg] : "",
    responsive?.xl ? responsiveColClasses.xl[responsive.xl] : "",
    gapClasses[gap],
    alignClasses[align],
    justifyClasses[justify],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const gridStyle = autoFit
    ? {
        ...style,
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}, 1fr))`,
      }
    : style;

  return (
    <div className={classes} style={gridStyle} {...props}>
      {children}
    </div>
  );
};

// Grid item component
export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column span */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | "full";
  /** Row span */
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
  /** Column start position */
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Row start position */
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Self alignment */
  alignSelf?: "start" | "center" | "end" | "stretch";
  /** Self justification */
  justifySelf?: "start" | "center" | "end" | "stretch";
  children?: React.ReactNode;
}

const colSpanClasses = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  12: "col-span-12",
  full: "col-span-full",
};

const rowSpanClasses = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
  5: "row-span-5",
  6: "row-span-6",
  full: "row-span-full",
};

const colStartClasses = {
  1: "col-start-1",
  2: "col-start-2",
  3: "col-start-3",
  4: "col-start-4",
  5: "col-start-5",
  6: "col-start-6",
  7: "col-start-7",
  8: "col-start-8",
  9: "col-start-9",
  10: "col-start-10",
  11: "col-start-11",
  12: "col-start-12",
};

const rowStartClasses = {
  1: "row-start-1",
  2: "row-start-2",
  3: "row-start-3",
  4: "row-start-4",
  5: "row-start-5",
  6: "row-start-6",
};

const alignSelfClasses = {
  start: "self-start",
  center: "self-center",
  end: "self-end",
  stretch: "self-stretch",
};

const justifySelfClasses = {
  start: "justify-self-start",
  center: "justify-self-center",
  end: "justify-self-end",
  stretch: "justify-self-stretch",
};

export const GridItem: React.FC<GridItemProps> = ({
  colSpan,
  rowSpan,
  colStart,
  rowStart,
  alignSelf,
  justifySelf,
  children,
  className = "",
  ...props
}) => {
  const classes = [
    colSpan ? colSpanClasses[colSpan] : "",
    rowSpan ? rowSpanClasses[rowSpan] : "",
    colStart ? colStartClasses[colStart] : "",
    rowStart ? rowStartClasses[rowStart] : "",
    alignSelf ? alignSelfClasses[alignSelf] : "",
    justifySelf ? justifySelfClasses[justifySelf] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Specialized grid layouts
export const DashboardGrid: React.FC<Omit<GridProps, "cols" | "responsive">> = (
  props
) => (
  <Grid
    cols={1}
    responsive={{
      sm: 2,
      md: 3,
      lg: 4,
      xl: 6,
    }}
    gap="lg"
    {...props}
  />
);

export const FormGrid: React.FC<Omit<GridProps, "cols" | "gap">> = (props) => (
  <Grid cols={1} responsive={{ md: 2 }} gap="md" {...props} />
);

export const CardGrid: React.FC<Omit<GridProps, "autoFit" | "minColWidth">> = (
  props
) => <Grid autoFit minColWidth="300px" gap="lg" {...props} />;

export default Grid;
