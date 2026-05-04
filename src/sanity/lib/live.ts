import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  QueryParams,
} from "@sanity/client";
// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from "next-sanity/live";
import { client } from "./client";

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: process.env.SANITY_API_TOKEN,
  browserToken: false,
});

type SafeSanityFetchOptions<QueryString extends string> = {
  query: QueryString;
  params?: QueryParams | Promise<QueryParams>;
  tags?: string[];
  perspective?: Exclude<ClientPerspective, "raw">;
  stega?: boolean;
  tag?: never;
  requestTag?: string;
};

type SafeSanityFetchResult<QueryString extends string> = {
  data: ClientReturn<QueryString> | null;
  sourceMap: ContentSourceMap | null;
  tags: string[];
};

export async function safeSanityFetch<const QueryString extends string>(
  args: SafeSanityFetchOptions<QueryString>,
): Promise<SafeSanityFetchResult<QueryString>> {
  try {
    return await sanityFetch(args);
  } catch (error) {
    console.error("Sanity fetch failed", error);

    return {
      data: null,
      sourceMap: null,
      tags: [],
    };
  }
}
