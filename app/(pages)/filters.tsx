import React, { useCallback, useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { ThemedView } from "@/components/themed/atomic/ThemedView";
import LanguageFilterSection from "@/components/home/filters/LanguageFilterSection";
import GenderFilterSection from "@/components/home/filters/GenderFilterSection";

const Filters = () => {
  const { currentUser } = useAuth();
  const languages = currentUser?.languages;

  const [studyLanguages, setStudyLanguages] = useState([]);
  const [motherLanguages, setMotherLanguages] = useState([]);
  const [gender, setGender] = useState();

  const components = [
    {
      component: (
        <LanguageFilterSection
          languages={languages}
          studyLanguages={studyLanguages}
          setStudyLanguages={setStudyLanguages}
          motherLanguages={motherLanguages}
          setMotherLanguages={setMotherLanguages}
        />
      ),
      key: "LanguagesFilterSection",
    },
    {
      component: <GenderFilterSection gender={gender} setGender={setGender} />,
      key: "GenderFilterSection",
    },
  ];

  useEffect(() => {
    console.log("items", gender);
  }, [gender]);

  const renderItem = useCallback(
    ({ item }) => (
      <ThemedView style={styles.itemContainer}>{item.component}</ThemedView>
    ),
    []
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <FlatList
          data={components}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
        />
      </SafeAreaView>
    </ThemedView>
  );
};

export default Filters;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    fontSize: 14,
    color: "red",
  },
});
