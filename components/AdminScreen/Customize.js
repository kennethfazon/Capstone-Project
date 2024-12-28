import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isDropped, setIsDropped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const draggerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(dragPos.x, { damping: 20, stiffness: 100 }) },
        { translateY: withSpring(dragPos.y, { damping: 20, stiffness: 100 }) },
      ],
    };
  });

  const onGestureEvent = (event) => {
    setDragPos({ x: event.nativeEvent.translationX, y: event.nativeEvent.translationY });
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) { // END
      const isDroppedHere = checkDropZone(dragPos.x, dragPos.y);
      if (isDroppedHere) {
        setIsDropped(true);
      } else {
        setIsDropped(false);
        setDragPos({ x: 0, y: 0 }); // Reset position if not dropped
      }
    }
  };

  // Function to check if the draggable item is dropped within the drop zone
  const checkDropZone = (x, y) => {
    const dropZoneX = width * 0.2;  // X position of the drop zone
    const dropZoneY = height * 0.4; // Y position of the drop zone
    const dropZoneWidth = width * 0.6;
    const dropZoneHeight = height * 0.2;

    // Check if the draggable item intersects with the drop zone
    return (
      x > dropZoneX &&
      x < dropZoneX + dropZoneWidth &&
      y > dropZoneY &&
      y < dropZoneY + dropZoneHeight
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Draggable and Droppable</Text>

      {/* Draggable item */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}>
        <Animated.View
          style={[
            styles.draggable,
            dragging && styles.dragging,
            draggerStyle,
            { zIndex: dragging ? 2 : 1 }  // Bring the draggable item above drop zone when dragging
          ]}
          onLayout={() => setDragging(true)}
        >
          <Text style={styles.dragText}>{isDropped ? 'Dropped' : 'Drag me'}</Text>
        </Animated.View>
      </PanGestureHandler>

      {/* Drop zone */}
      <View
        style={[
          styles.dropZone,
          isDropped && styles.dropped,
          { zIndex: 1 } // Drop zone stays behind the draggable box by default
        ]}
      >
        <Text style={styles.dropZoneText}>Drop Zone</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Change the background to a light color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  draggable: {
    width: 120,
    height: 120,
    backgroundColor: '#29e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'absolute',
    elevation: 3, // Elevation to give it a subtle shadow (Android)
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dragging: {
    opacity: 0.7,
  },
  dragText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropZone: {
    width: width * 0.6,
    height: height * 0.2,
    backgroundColor: '#bfe4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#aaa',
    position: 'absolute',
    top: height * 0.4, // Adjust the Y position of the drop zone
    zIndex: 1,
    elevation: 1, // Keep the drop zone behind the draggable box (Android)
  },
  dropped: {
    backgroundColor: '#29e',
    borderColor: '#fff',
  },
  dropZoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
