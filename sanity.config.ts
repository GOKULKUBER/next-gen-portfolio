"use client";

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import { RocketIcon } from "@sanity/icons";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { presentationTool } from "sanity/presentation"

export default defineConfig({
  basePath: "/studio",
  projectId: "83ugvqa6",
  dataset: "develope",
  title: "NextGen Portfolio",
  subtitle: "Content Management System",
  icon: RocketIcon,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({ structure, title: "Content" }),
    presentationTool({
      previewUrl:{
        initial:process.env.SANITY_STUDIO_PREVIEW_ORIGIN,
        preview:"/",
        previewMode:{
          enable:"/api/draft-mode/enable"
        }
      }
    }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion, title: "GROQ" }),
  ],
});
