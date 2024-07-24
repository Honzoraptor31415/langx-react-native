import { Query } from "react-native-appwrite";
import { User } from "@/models/User";
import { listDocuments } from "@/services/apiService";
import { USERS_COLLECTION, PAGINATION_LIMIT } from "@/constants/config";

interface FilterDataInterface {
  gender?: string;
  country?: string;
  ageRange?: number[];
  motherLanguages?: string[];
  studyLanguages?: string[];
  isMatchMyGender?: boolean;
}

export async function listUsers(params: any): Promise<User[]> {
  const userId = params?.userId;
  const filterData = params?.filterData || null;
  const offset = params?.currentOffset || null;
  console.log("----", filterData);

  try {
    const queries = [
      Query.orderDesc("$updatedAt"),
      Query.notEqual("$id", userId),
      Query.limit(PAGINATION_LIMIT),
    ];

    if (offset) {
      queries.push(Query.offset(offset));
    }

    if (filterData) {
      const filterQueries = createFilterQueries(JSON.parse(filterData));
      queries.push(...filterQueries);
    }

    const users = await listDocuments(USERS_COLLECTION, queries);
    return users.documents as User[];
  } catch (error) {
    throw new Error(error.message);
  }
}

function createFilterQueries(filterData: FilterDataInterface): any[] {
  const queries: any[] = [];

  // Query for users with the selected gender filter
  if (filterData?.gender) {
    queries.push(Query.equal("gender", filterData?.gender));
  }

  // Query for users with the selected country filter
  if (filterData?.country) {
    queries.push(Query.equal("countryCode", filterData?.country));
  }

  // Query for users with birthdates between the selected min and max ages
  if (filterData?.ageRange) {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - filterData?.ageRange[1]);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - filterData?.ageRange[0]);

    queries.push(Query.greaterThanEqual("birthdate", minDate.toISOString()));
    queries.push(Query.lessThanEqual("birthdate", maxDate.toISOString()));
  }

  // Query for users with the selected languages filter
  if (filterData?.motherLanguages.length > 0) {
    const keywords = filterData.motherLanguages;
    // OR Query for users with any of the selected languages
    queries.push(Query.contains("motherLanguages", keywords));
  }
  if (filterData?.studyLanguages.length > 0) {
    const keywords = filterData.studyLanguages;
    // OR Query for users with any of the selected languages
    queries.push(Query.contains("studyLanguages", keywords));
  }

  console.log("---- queries", queries);

  return queries;
}
