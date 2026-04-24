import { getTranslations } from 'next-intl/server';

import type { PlaceholderKey } from '@/shared/lib/placeholders';
import { Button } from '@/shared/ui/button';

import { BlogPostCard } from './blog-post-card';

type BlogPost = {
  category: string;
  title: string;
  description: string;
  author: string;
  date: string;
  image: PlaceholderKey;
  avatar: string;
};

export async function LatestBlogPosts() {
  const t = await getTranslations('home.blog');
  const posts = t.raw('posts') as BlogPost[];

  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
            <div className="flex flex-col gap-4 md:max-w-[720px]">
              <span className="text-sm font-semibold text-brand">
                {t('eyebrow')}
              </span>
              <h2 className="text-pretty text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[40px] lg:leading-[1.15]">
                {t('title')}
              </h2>
              <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                {t('description')}
              </p>
            </div>
            <Button
              className="h-11 w-fit gap-2 rounded-lg bg-brand px-5 text-base font-medium text-brand-foreground hover:bg-brand/90 md:mt-2"
              render={<a href="#" />}
              nativeButton={false}
            >
              {t('viewAll')}
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
            {posts.map((post, index) => (
              <BlogPostCard
                key={post.title}
                category={post.category}
                title={post.title}
                description={post.description}
                author={post.author}
                date={post.date}
                image={post.image}
                avatar={post.avatar}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
