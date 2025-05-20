import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Image, SafeAreaView, Dimensions, View, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode, Audio } from 'expo-av';
import Zoom from './index';

const { width,height } = Dimensions.get('window');

// Mixed media array with both images and videos
const mediaItems = [
  { type: 'image', uri: 'https://assets.myntassets.com/v1/assets/images/15557590/2022/2/18/a88d594a-0184-4042-baad-01c2d7874cec1645166286136-Roadster-Men-Shirts-4091645166285596-1.jpg' },
  { type: 'image', uri: 'https://assets.myntassets.com/v1/assets/images/29270038/2024/4/30/5254f373-744e-4780-be2f-368fabb4b9d81714486426940V-MartMenSolidCottonKnittedDenimMid-RiseJeansM1.jpg' },
  { type: 'image', uri: 'https://assets.myntassets.com/v1/assets/images/25556926/2023/10/19/ba4e6452-f1a6-4ca2-8aa0-e12917f7be9d1697721434740WATCHSTARMenBlackDialSilverTonedStainlessSteelBraceletStyleS1.jpg' },
  //   { type: 'image', uri: 'https://assets.myntassets.com/v1/assets/images/25827482/2024/1/10/8abbe80d-ceb9-44a2-869d-ff73e33f92791704887276042-WROGN-Men-Jeans-4811704887275592-1.jpg' },
  { type: 'video', uri: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { type: 'video', uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' }];

const VideoPlayer = ({ uri, onStatusChange, onPlayPause, onMuteToggle, isMuted }: { 
  uri: string;
  onStatusChange: (status: any) => void;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  isMuted: boolean;
}) => {
  const video = useRef<Video>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: 1,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log('Error setting audio mode:', error);
      }
    };
    
    setupAudio();
  }, []);

  useEffect(() => {
    if (video.current) {
      video.current.playAsync();
    }
  }, []);

  return (
    <View style={styles.videoContainer}>
      <View style={styles.videoWrapper}>
        <Video
          ref={video}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping={true}
          isMuted={isMuted}
          onPlaybackStatusUpdate={onStatusChange}
          useNativeControls={false}
          volume={1.0}
        />
        
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onPlayPause}
          activeOpacity={1}
        />
      </View>
    </View>
  );
};

export default function ImageZoomScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<any>({});
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<Video>(null);

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goNext = () => {
    if (currentIndex < mediaItems.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    try {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.log('Error playing/pausing video:', error);
    }
  };

  const renderMedia = () => {
    const item = mediaItems[currentIndex];
    
    if (item.type === 'video') {
      return (
        <>
          <Zoom style={styles.zoomContainer}>
            <VideoPlayer 
              uri={item.uri}
              onStatusChange={setStatus}
              onPlayPause={handlePlayPause}
              onMuteToggle={() => setIsMuted(!isMuted)}
              isMuted={isMuted}
            />
          </Zoom>
          {/* Controls positioned absolutely relative to the screen */}
          <View style={styles.controlsOverlay}>
            <View style={styles.controls}>
              <TouchableOpacity 
                onPress={handlePlayPause}
                style={styles.controlButton}
              >
                <Text style={styles.controlText}>
                  {status?.isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setIsMuted(!isMuted)}
                style={styles.controlButton}
              >
                <Text style={styles.controlText}>
                  {isMuted ? '🔇' : '🔊'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${status?.positionMillis && status?.durationMillis
                      ? (status.positionMillis / status.durationMillis) * 100
                      : 0}%`
                  }
                ]}
              />
            </View>
          </View>
        </>
      );
    }

    return (
      <Zoom style={styles.zoomContainer}>
        <Image
          source={{ uri: item.uri }}
          style={styles.image}
          resizeMode="contain"
        />
      </Zoom>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.chevronContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.chevronLeft} onPress={goPrev}>
            <Text style={styles.chevronText}>{'<'}</Text>
          </TouchableOpacity>
        )}
        {renderMedia()}
        {currentIndex < mediaItems.length - 1 && (
          <TouchableOpacity style={styles.chevronRight} onPress={goNext}>
            <Text style={styles.chevronText}>{'>'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  chevronContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: width,
    height: height,
  },
  chevronLeft: {
    position: 'absolute',
    left: 5,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  chevronRight: {
    position: 'absolute',
    right: 5,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  chevronText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: width,
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: width,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 9999, // Very high z-index to ensure it stays on top
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 10,
    borderRadius: 25,
    minWidth: 50,
    alignItems: 'center',
  },
  controlText: {
    color: '#fff',
    fontSize: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
}); 