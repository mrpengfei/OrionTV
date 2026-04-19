import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { View, TextInput, StyleSheet, Animated, Platform, Switch, TouchableOpacity } from "react-native";
import { useTVEventHandler } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { SettingsSection } from "./SettingsSection";
import { useSettingsStore } from "@/stores/settingsStore";
import { useRemoteControlStore } from "@/stores/remoteControlStore";
import { useButtonAnimation } from "@/hooks/useAnimation";
import { Colors } from "@/constants/Colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface VideoProxySectionProps {
  onChanged: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  hideDescription?: boolean;
}

export interface VideoProxySectionRef {
  setInputValue: (value: string) => void;
}

export const VideoProxySection = forwardRef<VideoProxySectionRef, VideoProxySectionProps>(
  ({ onChanged, onFocus, onBlur, onPress, hideDescription = false }, ref) => {
    const { videoProxy, setVideoProxyEnabled, setVideoProxyServerUrl } = useSettingsStore();
    const { serverUrl } = useRemoteControlStore();
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isSectionFocused, setIsSectionFocused] = useState(false);
    const [isToggleFocused, setIsToggleFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const toggleRef = useRef<TouchableOpacity>(null);
    const inputAnimationStyle = useButtonAnimation(isSectionFocused && !isInputFocused, 1.01);
    const toggleAnimationStyle = useButtonAnimation(isSectionFocused && !isInputFocused, 1.2);
    const deviceType = useResponsiveLayout().deviceType;

    const handleUrlChange = (url: string) => {
      setVideoProxyServerUrl(url);
      onChanged();
    };

    const handleToggle = (enabled: boolean) => {
      setVideoProxyEnabled(enabled);
      onChanged();
    };

    useImperativeHandle(ref, () => ({
      setInputValue: (value: string) => {
        setVideoProxyServerUrl(value);
        onChanged();
      },
    }));

    const handleSectionFocus = () => {
      setIsSectionFocused(true);
      onFocus?.();
    };

    const handleSectionBlur = () => {
      setIsSectionFocused(false);
      setIsInputFocused(false);
      setIsToggleFocused(false);
      onBlur?.();
    };

    const handleTogglePress = () => {
      handleToggle(!videoProxy.enabled);
    };

    const handleInputPress = () => {
      inputRef.current?.focus();
    };

    // TV遥控器事件处理
    const handleTVEvent = React.useCallback(
      (event: any) => {
        if (!isSectionFocused) return;

        if (event.eventType === "select") {
          // If input is focused, do nothing (let text input handle)
          if (isInputFocused) return;
          // Otherwise toggle the proxy enabled state
          handleToggle(!videoProxy.enabled);
        } else if (event.eventType === "right" && !isInputFocused) {
          // Move focus from toggle to input
          setIsToggleFocused(false);
          inputRef.current?.focus();
        } else if (event.eventType === "left" && isInputFocused) {
          // Move focus from input to toggle
          setIsInputFocused(false);
          setIsToggleFocused(true);
        }
      },
      [isSectionFocused, isInputFocused, videoProxy.enabled]
    );

    useTVEventHandler(handleTVEvent);

    const [selection, setSelection] = useState<{ start: number; end: number }>({
      start: 0,
      end: 0,
    });

    const onSelectionChange = ({
      nativeEvent: { selection },
    }: any) => {
      setSelection(selection);
    };

    // Determine layout based on device type
    const isMobile = deviceType === "mobile";
    const isTV = deviceType === "tv";
    const isTablet = deviceType === "tablet";

    return (
      <SettingsSection
        focusable
        onFocus={handleSectionFocus}
        onBlur={handleSectionBlur}
        {...Platform.isTV || deviceType !== 'tv' ? undefined : { onPress: handleTogglePress }}
      >
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.sectionTitle}>视频代理</ThemedText>
            {!hideDescription && serverUrl && (
              <ThemedText style={styles.subtitle}>用手机访问 {serverUrl}，可远程输入</ThemedText>
            )}
          </View>

          <View style={[styles.contentContainer, isMobile ? styles.mobileLayout : styles.tvTabletLayout]}>
            {/* Toggle switch */}
            <Animated.View style={toggleAnimationStyle}>
              {Platform.OS === 'ios' && Platform.isTV ? (
                <TouchableOpacity
                  ref={toggleRef}
                  activeOpacity={0.8}
                  onPress={handleTogglePress}
                  style={[styles.toggleContainer, !videoProxy.enabled && styles.toggleDisabled]}
                  onFocus={() => setIsToggleFocused(true)}
                  onBlur={() => setIsToggleFocused(false)}
                >
                  <ThemedText style={styles.toggleLabel}>启用代理</ThemedText>
                  <View style={styles.toggleStatus}>
                    <ThemedText style={styles.toggleValue}>
                      {videoProxy.enabled ? '已启用' : '已禁用'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.toggleContainer}>
                  <ThemedText style={styles.toggleLabel}>启用代理</ThemedText>
                  <Switch
                    value={videoProxy.enabled}
                    onValueChange={handleToggle}
                    trackColor={{ false: "#767577", true: Colors.dark.primary }}
                    thumbColor={videoProxy.enabled ? "#ffffff" : "#f4f3f4"}
                  />
                </View>
              )}
            </Animated.View>

            {/* URL input */}
            <Animated.View style={inputAnimationStyle}>
              <TextInput
                ref={inputRef}
                style={[styles.input, isInputFocused && styles.inputFocused, !videoProxy.enabled && styles.inputDisabled]}
                value={videoProxy.serverUrl}
                onChangeText={handleUrlChange}
                placeholder="输入代理服务器地址"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                editable={videoProxy.enabled}
                onFocus={() => {
                  setIsInputFocused(true);
                  setIsToggleFocused(false);
                  const end = videoProxy.serverUrl.length;
                  setSelection({ start: end, end: end });
                  setTimeout(() => {
                    inputRef.current?.setNativeProps({ selection: { start: end, end: end } });
                  }, 0);
                }}
                selection={selection}
                onSelectionChange={onSelectionChange}
                onBlur={() => setIsInputFocused(false)}
              />
            </Animated.View>
          </View>
        </View>
      </SettingsSection>
    );
  }
);

VideoProxySection.displayName = "VideoProxySection";

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 12,
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  contentContainer: {
    gap: 12,
  },
  mobileLayout: {
    flexDirection: "column",
  },
  tvTabletLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleDisabled: {
    opacity: 0.6,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#ccc",
  },
  toggleStatus: {
    backgroundColor: "#3a3a3c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleValue: {
    fontSize: 14,
    color: "white",
  },
  input: {
    height: 50,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#3a3a3c",
    color: "white",
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "#2a2a2c",
  },
});