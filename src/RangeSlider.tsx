import * as React from "react";
import { StyleSheet, css } from "aphrodite";
import { Manager } from "hammerjs";

const radius = 200;
const circleStroke = 40;
const radiusWithoutStroke = radius - circleStroke * 2;
const circumference = radiusWithoutStroke * 2 * Math.PI;
const cutOfPercentage = 10;

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    width: "400px",
    height: "400px"
  },
  circleBackground: {
    fill: "transparent",
    stroke: "#E1007E"
  },
  circleBackgroundClip: {
    fill: "transparent",
    stroke: "#fff",
    transform: "rotate(90deg)",
    transformOrigin: "center"
  },
  circleRange: {
    fill: "transparent",
    stroke: "#F5F5F5",
    transform: "rotate(90deg)",
    transformOrigin: "center"
  },
  dragStart: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "black",
    position: "absolute",
    zIndex: 3,
    marginTop: "-20px",
    marginLeft: "-20px"
  },
  valueLabels: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    display: "flex;",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial"
  },
  valueLabel: {
    textAlign: "center",
    minWidth: "50px"
  }
});

type RangeSliderState = {
  range: number[];
  smooth: boolean;
};

type RangeSliderProps = {
  maxValue: number;
};

export class RangeSlider extends React.Component<
  RangeSliderProps,
  RangeSliderState
> {
  private startHandle: React.RefObject<HTMLDivElement> = React.createRef();
  private endHandle: React.RefObject<HTMLDivElement> = React.createRef();
  private startHandleHammerJsManager: HammerManager | undefined;
  private endHandleHammerJsManager: HammerManager | undefined;

  public state: RangeSliderState = {
    range: [40, 100], // to get 50%, insert 75. to get 25%, insert 50 etc,
    smooth: true
  };

  public componentDidMount = (): void => {
    this.startHandleHammerJsManager = new Manager(this.startHandle.current);
    this.endHandleHammerJsManager = new Manager(this.endHandle.current);

    this.startHandleHammerJsManager.add(
      new Hammer.Pan({ threshold: 0, pointers: 0 })
    );
    this.endHandleHammerJsManager.add(
      new Hammer.Pan({ threshold: 0, pointers: 0 })
    );

    this.startHandleHammerJsManager.on("pan", this.startHandleSwipeHandler);
    this.endHandleHammerJsManager.on("pan", this.endHandleSwipeHandler);
  };

  public render(): JSX.Element {
    const { range } = this.state;
    const { maxValue } = this.props;
    const startPercentage = this.getRealPercentage(range[0]);
    const endPercentage = this.getRealPercentage(range[1]);

    const strokeDashoffset =
      circumference - (startPercentage / 100) * circumference;

    const rangeDifference = Math.round(endPercentage - startPercentage);
    const circumferenceLength = (circumference / 100) * rangeDifference;

    return (
      <div>
        <div className={css(styles.wrapper)}>
          <div className={css(styles.valueLabels)}>
            <div className={css(styles.valueLabel)}>
              <strong>Van</strong> <br />
              {Math.round(
                (maxValue / 100) * (startPercentage - cutOfPercentage / 2)
              )}
            </div>
            <div className={css(styles.valueLabel)}>
              <strong>Tot</strong> <br />
              {Math.round(
                (maxValue / 100) * (endPercentage + cutOfPercentage / 2)
              )}
            </div>
          </div>

          <svg height={radius * 2} width={radius * 2}>
            <circle
              className={css(styles.circleBackground)}
              strokeWidth={circleStroke}
              r={radiusWithoutStroke}
              cx={radius}
              cy={radius}
            />

            <circle
              className={css(styles.circleRange)}
              strokeWidth={circleStroke + 3} // this way the active color doesn't bleed
              strokeDasharray={circumference + " " + circumferenceLength}
              style={{ strokeDashoffset }}
              r={radiusWithoutStroke}
              cx={radius}
              cy={radius}
            />

            <circle
              className={css(styles.circleBackgroundClip)}
              strokeWidth={circleStroke + 20}
              strokeDasharray={
                circumference +
                " " +
                (circumference / 100) * (100 - cutOfPercentage)
              }
              style={{
                strokeDashoffset:
                  (circumference / 100) * (100 - cutOfPercentage / 2)
              }}
              r={radiusWithoutStroke}
              cx={radius}
              cy={radius}
            />
          </svg>

          <div
            className={css(styles.dragStart)}
            ref={this.startHandle}
            style={{
              left: this.getThumbPosition(0).x,
              top: this.getThumbPosition(0).y
            }}
          />

          <div
            className={css(styles.dragStart)}
            ref={this.endHandle}
            style={{
              left: this.getThumbPosition(1).x,
              top: this.getThumbPosition(1).y
            }}
          />
        </div>

        <p>
          Smooth (disabling creates 'staggered' effect){" "}
          <input
            type="checkbox"
            checked={this.state.smooth}
            onChange={this.handleSmoothCheckBox}
          />
        </p>
      </div>
    );
  }

  private handleSmoothCheckBox = (): void => {
    this.setState({
      smooth: !this.state.smooth
    });
  };

  private setPercentage = (x: number, y: number, index: number): void => {
    const doublePI = Math.PI * 2;
    const dx = x - radius;
    const dy = y - radius;
    const angle = (Math.atan2(dy, dx) + doublePI) % doublePI;
    const percentage = Number((angle / doublePI) * 100);
    let range = JSON.parse(JSON.stringify(this.state.range));

    const differenceWithOldValue = Math.abs(percentage - range[index]);

    if (differenceWithOldValue < 5 && !this.state.smooth) {
      return;
    }

    range.splice(
      index,
      1,
      index === 1 ? Math.ceil(percentage) : Math.floor(percentage)
    );

    // This stops the handles from overlapping
    if (this.getRangeDifference(range) < 5) {
      return;
    }

    // stop before the offset
    if (
      this.getRealPercentage(range[0]) < cutOfPercentage / 2 ||
      this.getRealPercentage(range[1]) > 100 - cutOfPercentage / 2
    ) {
      return;
    }

    this.setState({
      range: range
    });
  };

  private getTiltedPercentage(percentage: number): number {
    const tiltedPercentage =
      percentage - 25 > 0 ? percentage - 25 : percentage - 125;

    return tiltedPercentage;
  }

  private tiltedToRealPercentage(tiltedPercentage: number): number {
    if (tiltedPercentage > 0) {
      return tiltedPercentage;
    } else {
      let percentage = 100 - tiltedPercentage * -1;
      percentage = 100 - percentage * -1;
      return percentage;
    }
  }

  private startHandleSwipeHandler = (event: HammerInput): void => {
    this.setPercentage(event.center.x, event.center.y, 0);
  };

  private endHandleSwipeHandler = (event: HammerInput): void => {
    this.setPercentage(event.center.x, event.center.y, 1);
  };

  private getThumbPosition = (index: number) => {
    const center = radius;
    const angle = ((Math.PI * 2) / 100) * this.state.range[index];

    return {
      x: radius + radiusWithoutStroke * Math.cos(angle),
      y: center + radiusWithoutStroke * Math.sin(angle)
    };
  };

  private getRealPercentage(percentage: number) {
    const tiltedPercentage = this.getTiltedPercentage(percentage);

    return this.tiltedToRealPercentage(tiltedPercentage);
  }

  private getRangeDifference = (range: number[]): number => {
    const rangeDifference = Math.round(
      this.getRealPercentage(range[1]) - this.getRealPercentage(range[0])
    );

    return rangeDifference;
  };
}
