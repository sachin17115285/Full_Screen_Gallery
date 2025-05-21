import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {
  ComposedGesture,
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
  State,
} from 'react-native-gesture-handler'
import { GestureStateManagerType } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager'
import Animated, {
  AnimatableValue,
  AnimationCallback,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { MAX_SCALE, MIN_SCALE } from './constants'
import { clampScale, getScaleFromDimensions } from './utils'

import styles from './styles'
export type AnimationConfigProps = Parameters<typeof withTiming>[1];
interface UseZoomGestureProps {
  animationFunction?: typeof withTiming;
  animationConfig?: AnimationConfigProps;
  doubleTapConfig?: {
    defaultScale?: number;
    minZoomScale?: number;
    maxZoomScale?: number;
  };
}

export function useZoomGesture(props: UseZoomGestureProps = {}): {
  zoomGesture: ComposedGesture;
  contentContainerAnimatedStyle: any;
  onLayout(event: LayoutChangeEvent): void;
  onLayoutContent(event: LayoutChangeEvent): void;
  zoomOut(): void;
  isZoomedIn: SharedValue<boolean>;
  zoomGestureLastTime: SharedValue<number>;
} {
  const {
    animationFunction = withTiming,
    animationConfig,
    doubleTapConfig,
  } = props

  const baseScale = useSharedValue(1)
  const pinchScale = useSharedValue(1)
  const lastScale = useSharedValue(1)
  const isZoomedIn = useSharedValue(false)
  const zoomGestureLastTime = useSharedValue(0)

  const containerDimensions = useSharedValue({ width: 0, height: 0 })
  const contentDimensions = useSharedValue({ width: 1, height: 1 })

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const lastOffsetX = useSharedValue(0)
  const lastOffsetY = useSharedValue(0)
  const panStartOffsetX = useSharedValue(0)
  const panStartOffsetY = useSharedValue(0)
  const velocity = useSharedValue({ x: 0, y: 0 })

  const handlePanOutsideTimeoutId: React.MutableRefObject<
    ReturnType<typeof setTimeout> | undefined
  > = useRef()

  const MIN_PINCH_SCALE = 0.8; // 50% of original size

  const withAnimation = useCallback(
    (toValue: number, config?: AnimationConfigProps) => {
      'worklet'

      return animationFunction(toValue, {
        duration: 350,
        easing: Easing.linear,
        ...config,
        ...animationConfig,
      })
    },
    [animationFunction, animationConfig]
  )

  const getContentContainerSize = useCallback(() => {
    'worklet';
    return {
      width: containerDimensions.value.width,
      height:
        (contentDimensions.value.height * containerDimensions.value.width) /
        contentDimensions.value.width,
    }
  }, [containerDimensions, contentDimensions])

  const zoomIn = useCallback((tapLocation?: { x: number; y: number }): void => {
    const { width, height } = getContentContainerSize();

    // Get scale from config or calculate it
    const newScale =
      doubleTapConfig?.defaultScale ?? getScaleFromDimensions(width, height);

    const clampedScale = clampScale(
      newScale,
      doubleTapConfig?.minZoomScale ?? MIN_SCALE,
      doubleTapConfig?.maxZoomScale ?? MAX_SCALE
    );

    lastScale.value = clampedScale;

    // Use a shorter duration and ensure linear easing for a more direct zoom feel
    baseScale.value = withTiming(clampedScale, { 
      duration: 350, // Faster animation
      easing: Easing.linear // Strict linear easing
    });
    pinchScale.value = withTiming(1, { 
      duration: 350, 
      easing: Easing.linear 
    });

    // Default to center if no tap location
    let newOffsetX = 0;
    let newOffsetY = 0;

    if (tapLocation) {
      // Use the original coordinate calculation which works correctly
      const containerCenterX = containerDimensions.value.width / 2;
      const containerCenterY = containerDimensions.value.height / 2;
      newOffsetX = (containerCenterX - tapLocation.x) * (clampedScale - 1) / clampedScale;
      newOffsetY = (containerCenterY - tapLocation.y) * (clampedScale - 1) / clampedScale;

      // --- Clamp the offset so the image doesn't move out of bounds ---
      const maxOffsetX = ((width * clampedScale) - containerDimensions.value.width) / 2 / clampedScale;
      const maxOffsetY = ((height * clampedScale) - containerDimensions.value.height) / 2 / clampedScale;

      newOffsetX = Math.max(Math.min(newOffsetX, maxOffsetX), -maxOffsetX);
      newOffsetY = Math.max(Math.min(newOffsetY, maxOffsetY), -maxOffsetY);
    }

    lastOffsetX.value = newOffsetX;
    lastOffsetY.value = newOffsetY;

    // Use the same shorter duration for translation to keep everything in sync
    translateX.value = withTiming(newOffsetX, { 
      duration: 350, 
      easing: Easing.linear 
    });
    translateY.value = withTiming(newOffsetY, { 
      duration: 350, 
      easing: Easing.linear 
    });

    isZoomedIn.value = true;
  }, [
    baseScale,
    pinchScale,
    lastOffsetX,
    lastOffsetY,
    translateX,
    translateY,
    isZoomedIn,
    lastScale,
    getContentContainerSize,
    doubleTapConfig,
    containerDimensions,
  ])

  const zoomOut = useCallback((): void => {
    const newScale = 1
    lastScale.value = newScale

    baseScale.value = withTiming(newScale, { duration: 350, easing: Easing.linear })
    pinchScale.value = withTiming(1, { duration: 350, easing: Easing.linear })

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = withTiming(newOffsetX, { duration: 350, easing: Easing.linear })
    translateY.value = withTiming(newOffsetY, { duration: 350, easing: Easing.linear })

    isZoomedIn.value = false
  }, [
    baseScale,
    pinchScale,
    lastOffsetX,
    lastOffsetY,
    translateX,
    translateY,
    lastScale,
    isZoomedIn,
  ])

  // Define a function outside of useCallback to handle the decay animation
  function applyDecayAnimation(
    containerDimensions: SharedValue<{width: number, height: number}>,
    contentDimensions: SharedValue<{width: number, height: number}>,
    lastScale: SharedValue<number>,
    pinchScale: SharedValue<number>,
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    velocity: SharedValue<{x: number, y: number}>,
    lastOffsetX: SharedValue<number>,
    lastOffsetY: SharedValue<number>
  ) {
    const width = containerDimensions.value.width;
    const height = contentDimensions.value.height * width / contentDimensions.value.width;
    const scale = lastScale.value * pinchScale.value;
    
    const maxOffsetX = width * scale < containerDimensions.value.width
      ? 0
      : (width * scale - containerDimensions.value.width) / 2 / scale;
    const maxOffsetY = height * scale < containerDimensions.value.height
      ? 0
      : (height * scale - containerDimensions.value.height) / 2 / scale;
    
    // Check if we're already at the boundary
    const isAtXBoundary = Math.abs(translateX.value) >= maxOffsetX || maxOffsetX === 0;
    const isAtYBoundary = Math.abs(translateY.value) >= maxOffsetY || maxOffsetY === 0;
    
    // Only apply decay if not at boundary or if moving away from boundary
    if (!isAtXBoundary || (isAtXBoundary && 
        (translateX.value > 0 && velocity.value.x < 0) || 
        (translateX.value < 0 && velocity.value.x > 0))) {
      translateX.value = withDecay({
        velocity: velocity.value.x,
        clamp: [-maxOffsetX, maxOffsetX],
      });
      lastOffsetX.value = withDecay({
        velocity: velocity.value.x,
        clamp: [-maxOffsetX, maxOffsetX],
      });
    }
    
    if (!isAtYBoundary || (isAtYBoundary && 
        (translateY.value > 0 && velocity.value.y < 0) || 
        (translateY.value < 0 && velocity.value.y > 0))) {
      translateY.value = withDecay({
        velocity: velocity.value.y,
        clamp: [-maxOffsetY, maxOffsetY],
      });
      lastOffsetY.value = withDecay({
        velocity: velocity.value.y,
        clamp: [-maxOffsetY, maxOffsetY],
      });
    }
  }

  // Create a shared value to trigger pan decay animation
  const triggerPanDecay = useSharedValue(false);
  
  // Watch for changes to triggerPanDecay in a useEffect
  useEffect(() => {
    // Set up an interval to check for pan decay triggers
    const intervalId = setInterval(() => {
      if (triggerPanDecay.value) {
        // Reset the trigger immediately to prevent multiple triggers
        triggerPanDecay.value = false;
        
        // Handle the pan decay
        if (handlePanOutsideTimeoutId.current !== undefined) {
          clearTimeout(handlePanOutsideTimeoutId.current);
        }

        handlePanOutsideTimeoutId.current = setTimeout(() => {
          // Apply decay animation directly from JS thread
          applyDecayAnimation(
            containerDimensions,
            contentDimensions,
            lastScale,
            pinchScale,
            translateX,
            translateY,
            velocity,
            lastOffsetX,
            lastOffsetY
          );
        }, 10);
      }
    }, 16); // Check roughly every frame
    
    // Clean up the interval
    return () => {
      clearInterval(intervalId);
    };
  }, [
    containerDimensions,
    contentDimensions,
    lastScale,
    pinchScale,
    translateX,
    translateY,
    velocity,
    lastOffsetX,
    lastOffsetY
  ]);
  
  // This is a pure worklet function that will be called from the gesture handler
  const handlePanOutside = useCallback(() => {
    'worklet';
    
    // Just set the trigger to true
    triggerPanDecay.value = true;
  }, [triggerPanDecay])

  // Create a shared value to track double tap events
  const doubleTapEvent = useSharedValue<{ x: number; y: number } | null>(null);
  
  // Watch for changes to doubleTapEvent in a useEffect
  useEffect(() => {
    // Set up an interval to check for double tap events
    const intervalId = setInterval(() => {
      const event = doubleTapEvent.value;
      if (event !== null) {
        // Reset the event immediately to prevent multiple triggers
        doubleTapEvent.value = null;
        
        // Handle the double tap event
        if (isZoomedIn.value) {
          zoomOut();
        } else {
          zoomIn(event);
        }
      }
    }, 16); // Check roughly every frame
    
    // Clean up the interval
    return () => {
      clearInterval(intervalId);
    };
  }, [zoomIn, zoomOut, isZoomedIn]);
  
  // This is a pure worklet function that will be called from the gesture handler
  const onDoubleTap = useCallback((event?: { x: number; y: number }) => {
    'worklet';
    
    // Just store the event data in the shared value
    if (event) {
      doubleTapEvent.value = { x: event.x, y: event.y };
    } else {
      doubleTapEvent.value = { x: 0, y: 0 };
    }
  }, [doubleTapEvent]);

  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }: LayoutChangeEvent): void => {
      containerDimensions.value = {
        width,
        height,
      }
    },
    [containerDimensions]
  )

  const onLayoutContent = useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }: LayoutChangeEvent): void => {
      contentDimensions.value = {
        width,
        height,
      }
    },
    [contentDimensions]
  )

  const onPinchEnd = useCallback(
    (scale: number): void => {
      const newScale = lastScale.value * scale
      lastScale.value = newScale
      if (newScale > 1) {
        isZoomedIn.value = true
        baseScale.value = newScale
        pinchScale.value = 1

        handlePanOutside()
      } else {
        zoomOut()
      }
    },
    [lastScale, baseScale, pinchScale, handlePanOutside, zoomOut, isZoomedIn]
  )

  const updateZoomGestureLastTime = useCallback((): void => {
    'worklet'

    zoomGestureLastTime.value = Date.now()
  }, [zoomGestureLastTime])

  const zoomGesture = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onStart((event) => {
        updateZoomGestureLastTime();
      })
      .onEnd((event) => {
        updateZoomGestureLastTime();
        onDoubleTap({ x: event.x, y: event.y });
      })
      .maxDeltaX(25)
      .maxDeltaY(25)

    const panGesture = Gesture.Pan()
      .onStart(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime();

          const { translationX, translationY } = event;

          panStartOffsetX.value = translationX;
          panStartOffsetY.value = translationY;
        }
      )
      .onUpdate(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime();

          let { translationX, translationY } = event;

          translationX -= panStartOffsetX.value;
          translationY -= panStartOffsetY.value;

          // Calculate new position
          const newTranslateX = lastOffsetX.value + translationX / lastScale.value / pinchScale.value;
          const newTranslateY = lastOffsetY.value + translationY / lastScale.value / pinchScale.value;
          
          // Calculate boundaries based on content and container dimensions
          const { width, height } = getContentContainerSize();
          const scale = lastScale.value * pinchScale.value;
          
          // Calculate max offsets to keep image within boundaries
          const maxOffsetX = width * scale < containerDimensions.value.width
            ? 0
            : (width * scale - containerDimensions.value.width) / 2 / scale;
          const maxOffsetY = height * scale < containerDimensions.value.height
            ? 0
            : (height * scale - containerDimensions.value.height) / 2 / scale;
          
          // Clamp the translation values to stay within boundaries
          translateX.value = Math.max(Math.min(newTranslateX, maxOffsetX), -maxOffsetX);
          translateY.value = Math.max(Math.min(newTranslateY, maxOffsetY), -maxOffsetY);
        }
      )
      .onEnd(
        (
          event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
        ): void => {
          updateZoomGestureLastTime();

          let { translationX, translationY } = event;

          translationX -= panStartOffsetX.value;
          translationY -= panStartOffsetY.value;

          // Save the ending pan velocity for withDecay
          const { velocityX, velocityY } = event;
          velocity.value = {
            x: velocityX / lastScale.value,
            y: velocityY / lastScale.value,
          };

          // Calculate boundaries based on content and container dimensions
          const { width, height } = getContentContainerSize();
          const scale = lastScale.value * pinchScale.value;
          
          // Calculate max offsets to keep image within boundaries
          const maxOffsetX = width * scale < containerDimensions.value.width
            ? 0
            : (width * scale - containerDimensions.value.width) / 2 / scale;
          const maxOffsetY = height * scale < containerDimensions.value.height
            ? 0
            : (height * scale - containerDimensions.value.height) / 2 / scale;

          // Calculate new position with constraints
          const newOffsetX = lastOffsetX.value + translationX / lastScale.value;
          const newOffsetY = lastOffsetY.value + translationY / lastScale.value;
          
          // Apply constraints to the last offset values
          lastOffsetX.value = Math.max(Math.min(newOffsetX, maxOffsetX), -maxOffsetX);
          lastOffsetY.value = Math.max(Math.min(newOffsetY, maxOffsetY), -maxOffsetY);

          // Update the translation values to match the constrained offsets
          translateX.value = lastOffsetX.value;
          translateY.value = lastOffsetY.value;
          
          // Only use decay animation if within boundaries
          if (Math.abs(lastOffsetX.value) < maxOffsetX && Math.abs(lastOffsetY.value) < maxOffsetY) {
            // Trigger the pan decay animation
            triggerPanDecay.value = true;
          }
        }
      )
      .onTouchesMove(
        (e: GestureTouchEvent, state: GestureStateManagerType): void => {
          // Only activate if zoomed in or two fingers
          if (isZoomedIn.value || e.numberOfTouches === 2) state.activate();
          else state.fail();
        }
      )
      .onFinalize(() => {})
      .minDistance(0)

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        updateZoomGestureLastTime()
      })
      .onUpdate(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime()

          // Clamp scale to minimum 0.5
          pinchScale.value = Math.max(scale, MIN_PINCH_SCALE);
        }
      )
      .onEnd(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime()

          // Clamp scale to minimum 0.5
          const clampedScale = Math.max(scale, MIN_PINCH_SCALE);
          pinchScale.value = clampedScale;

          // If scale is less than 1, bounce back to 1
          if (lastScale.value * clampedScale < 1) {
            runOnJS(zoomOut)();
          } else {
            runOnJS(onPinchEnd)(clampedScale);
          }
        }
      )
      .onFinalize(() => {})

    return Gesture.Simultaneous(tapGesture, panGesture, pinchGesture)
  }, [
    handlePanOutside,
    lastOffsetX,
    lastOffsetY,
    onDoubleTap,
    onPinchEnd,
    pinchScale,
    translateX,
    translateY,
    lastScale,
    isZoomedIn,
    panStartOffsetX,
    panStartOffsetY,
    updateZoomGestureLastTime,
  ])

  const contentContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: baseScale.value * pinchScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  return {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut,
    isZoomedIn,
    zoomGestureLastTime,
  }
}

export default function Zoom(
  props: PropsWithChildren<ZoomProps>
): JSX.Element {
  const { style, contentContainerStyle, children, ...rest } = props

  const {
    zoomGesture,
    onLayout,
    onLayoutContent,
    contentContainerAnimatedStyle,
  } = useZoomGesture({
    ...rest,
  })

  return (
    <GestureDetector gesture={zoomGesture}>
      <View
        style={[styles.container, style]}
        onLayout={onLayout}
        collapsable={false}
      >
        <Animated.View
          style={[contentContainerAnimatedStyle, contentContainerStyle]}
          onLayout={onLayoutContent}
        >
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

export interface ZoomProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  animationConfig?: AnimationConfigProps;
  doubleTapConfig?: {
    defaultScale?: number;
    minZoomScale?: number;
    maxZoomScale?: number;
  };

  animationFunction?<T extends AnimatableValue>(
    toValue: T,
    userConfig?: AnimationConfigProps,
    callback?: AnimationCallback,
  ): T;
}