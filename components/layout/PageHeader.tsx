type Props = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <section className="container-edge pb-8 pt-10 md:pb-12 md:pt-14">
      <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-ash">
        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
        {eyebrow}
      </p>
      <h1 className="max-w-4xl text-4xl font-semibold md:text-6xl">{title}</h1>
      {description && <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{description}</p>}
    </section>
  );
}
