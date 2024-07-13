import { Query } from "react-native-appwrite";

import { Message } from "@/models/Message";
import { listDocuments } from "@/services/apiService";
import { MESSAGES_COLLECTION, PAGINATION_LIMIT } from "@/constants/config";

export async function listMessages(params: any) {
  const roomId = params?.roomId;
  const offset = params?.currentOffset;
  // console.log("roomId", roomId);
  // console.log("offset", offset);
  console.log("roomId", roomId);
  try {
    const queries = [
      Query.orderDesc("$createdAt"),
      Query.equal("$id", roomId),
      Query.limit(PAGINATION_LIMIT),
    ];

    if (offset) {
      queries.push(Query.offset(offset));
    }

    const messages = await listDocuments(MESSAGES_COLLECTION, queries);
    return messages.documents as Message[];
  } catch (error) {
    throw new Error(error.message);
  }
}
