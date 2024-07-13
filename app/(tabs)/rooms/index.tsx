import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

import { useDatabase } from "@/hooks/useDatabase";
import { listRooms } from "@/services/roomService";
import { Colors } from "@/constants/Colors";
import { defaultStyles } from "@/constants/Styles";
import { ThemedView } from "@/components/themed/atomic/ThemedView";
import RoomRow from "@/components/rooms/RoomRow";

const RoomsScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: rooms,
    loading,
    loadMore,
    refetch,
    hasMore,
  } = useDatabase(listRooms, { userId: user?.$id });

  useEffect(() => {
    console.log("rooms:", rooms?.length);
  }, [rooms]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    refetch();
    setIsRefreshing(false);
  };

  const onEndReached = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </ThemedView>
    );
  }, [hasMore]);

  const renderItem = useCallback(
    ({ item: room }) => <RoomRow room={room} />,
    []
  );

  const ItemSeparator = () => (
    <ThemedView style={[defaultStyles.separator, { marginLeft: 90 }]} />
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={rooms}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id.toString()}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
          />
        }
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default React.memo(RoomsScreen);
