import api from "@/lib/axios";

export interface FetchOwnerUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  accountStatus?: "ACTIVE" | "PENDING" | "BANNED" | string;
  isAccountVerified?: boolean;
}

export async function fetchOwnerUsers(
  pageOrParams: number | FetchOwnerUsersParams = 1,
  limit = 20,
  search?: string,
  accountStatus?: string,
  isAccountVerified?: boolean
) {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryStatus: string | undefined;
  let queryVerified: boolean | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
    querySearch = pageOrParams.search;
    queryStatus = pageOrParams.accountStatus;
    queryVerified = pageOrParams.isAccountVerified;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    querySearch = search;
    queryStatus = accountStatus;
    queryVerified = isAccountVerified;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));

  if (querySearch && querySearch.trim().length > 0) {
    query.set("search", querySearch.trim());
  }
  if (queryStatus && queryStatus !== "ALL") {
    query.set("accountStatus", queryStatus);
  }
  if (queryVerified !== undefined) {
    query.set("isAccountVerified", String(queryVerified));
  }

  const response = await api.get(`/api/owners/users?${query.toString()}`);
  return Array.isArray(response.data) ? response.data : [];
}

