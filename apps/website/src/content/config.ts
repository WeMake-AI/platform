import { defineCollection, z } from "astro:content";
const integrations = defineCollection({
  schema: z.object({
    integration: z.string(),
    description: z.string(),
    email: z.string(),
    permissions: z.array(z.string()),
    details: z.array(
      z.object({
        title: z.string(),
        value: z.string(),
        url: z.optional(z.string())
      })
    ),
    logo: z.object({
      url: z.string(),
      alt: z.string()
    })
  })
});
const helpdesk = defineCollection({
  schema: z.object({
    page: z.string(),
    description: z.string(),
    icon: z.object({
      url: z.string(),
      alt: z.string()
    })
  })
});
const customers = defineCollection({
  schema: z.object({
    customer: z.string(),
    challengesAndSolutions: z.array(
      z.object({
        title: z.string(),
        content: z.string()
      })
    ),
    results: z.array(z.string()),
    about: z.string(),
    details: z.record(z.string()),
    logo: z.object({
      url: z.string(),
      alt: z.string()
    })
  })
});
const legal = defineCollection({
  schema: z.object({
    page: z.string(),
    pubDate: z.date().optional(),
    description: z.string()
  })
});
const jobs = defineCollection({
  schema: z.object({
    position: z.string(),
    location: z.string(),
    team: z.string(),
    flag: z.object({
      url: z.string(),
      alt: z.string()
    })
  })
});
const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    headerImage: z
      .object({
        url: z.string(),
        alt: z.string()
      })
      .optional(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }),
    tags: z.array(z.string())
  })
});

export const collections = {
  integrations: integrations,
  helpdesk: helpdesk,
  customers: customers,
  legal: legal,
  jobs: jobs,
  posts: postsCollection
};
