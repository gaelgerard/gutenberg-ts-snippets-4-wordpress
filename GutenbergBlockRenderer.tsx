import { YouTubeEmbed } from '@next/third-parties/google';
import React from 'react';

interface GutenbergBlock {
    blockName: string | null;
    attrs: Record<string, string | number | boolean | null>;
    innerBlocks: GutenbergBlock[];
    innerHTML: string;
    innerContent: (string | null)[];
}

interface GutenbergBlockRendererProps {
    blocks: GutenbergBlock[];
}
function isImageBlock(block: GutenbergBlock): block is ImageBlock {
    return block.blockName === "core/image";
}

interface ImageBlock extends GutenbergBlock {
    blockName: "core/image";
    attrs: {
        id?: number;
        url: string;
        alt?: string;
        caption?: string | null;
        align?: string;
        className?: string;
        width?: number;
        height?: number;
    };
}


const GutenbergBlockRenderer: React.FC<GutenbergBlockRendererProps> = ({ blocks }) => {
    const renderBlock = (block: GutenbergBlock, index: number): React.ReactNode => {
        if (!block.blockName) {
            // Plain HTML content
            if (block.innerHTML) {
                return (
                    <div
                        key={index}
                        className="prose-content"
                        dangerouslySetInnerHTML={{ __html: block.innerHTML }}
                    />
                );
            }
            return null;
        }

        const { blockName, attrs, innerBlocks, innerHTML } = block;

        // Handle different block types
        switch (blockName) {
            case 'core/paragraph':
                return (
                    <p
                        key={index}
                        className={`mb-4 text-gray-700 leading-relaxed ${attrs.align ? `text-${attrs.align}` : ''}`}
                        dangerouslySetInnerHTML={{ __html: innerHTML }}
                    />
                );

            case 'core/heading':
                const level = attrs.level || 2;
                const headingClasses = {
                    1: 'text-4xl font-bold text-gray-900 mb-6 mt-8',
                    2: 'text-3xl font-bold text-gray-900 mb-5 mt-7',
                    3: 'text-2xl font-semibold text-gray-900 mb-4 mt-6',
                    4: 'text-xl font-semibold text-gray-800 mb-3 mt-5',
                    5: 'text-lg font-semibold text-gray-800 mb-2 mt-4',
                    6: 'text-base font-semibold text-gray-800 mb-2 mt-3',
                };
                return React.createElement(
                    `h${level}`,
                    {
                        key: index,
                        className: headingClasses[level as keyof typeof headingClasses] || headingClasses[2],
                        dangerouslySetInnerHTML: { __html: innerHTML }
                    }
                );

            case 'core/list':
                const ListTag = attrs.ordered ? 'ol' : 'ul';
                const listClass = attrs.ordered
                    ? 'list-decimal list-inside mb-4 space-y-2 text-gray-700'
                    : 'list-disc list-inside mb-4 space-y-2 text-gray-700';
                return (
                    <ListTag
                        key={index}
                        className={listClass}
                        dangerouslySetInnerHTML={{ __html: innerHTML }}
                    />
                );

            case 'core/quote':
                return (
                    <blockquote
                        key={index}
                        className="border-l-4 border-primary-500 pl-4 py-2 mb-4 italic text-gray-700 bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: innerHTML }}
                    />
                );

            case 'core/code':
                return (
                    <pre
                        key={index}
                        className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"
                    >
                        <code dangerouslySetInnerHTML={{ __html: innerHTML }} />
                    </pre>
                );

            case 'core/preformatted':
                return (
                    <pre
                        key={index}
                        className="bg-gray-100 text-gray-800 p-4 rounded-lg mb-4 overflow-x-auto whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: innerHTML }}
                    />
                );
            case "core/image": {
                // 1️⃣ Essayer attrs.url (WordPress le met parfois)
                let url =
                    typeof block.attrs.url === "string" ? block.attrs.url : undefined;

                // 2️⃣ Sinon, extraire depuis innerHTML
                if (!url && typeof block.innerHTML === "string") {
                    const match = block.innerHTML.match(/<img[^>]+src="([^"]+)"/);
                    if (match) {
                        url = match[1];
                    }
                }

                // 3️⃣ Même chose pour l'alt
                let alt =
                    typeof block.attrs.alt === "string"
                        ? block.attrs.alt
                        : "";

                if (!alt && typeof block.innerHTML === "string") {
                    const matchAlt = block.innerHTML.match(/<img[^>]+alt="([^"]*)"/);
                    if (matchAlt) {
                        alt = matchAlt[1];
                    }
                }

                // 4️⃣ Extract and validate width and height
                const width = typeof block.attrs.width === "string" || typeof block.attrs.width === "number"
                    ? block.attrs.width
                    : undefined;
                const height = typeof block.attrs.height === "string" || typeof block.attrs.height === "number"
                    ? block.attrs.height
                    : undefined;

                return (
                    <figure key={index} className="mb-6">
                        {url && (
                            <img
                                src={url}
                                alt={alt}
                                className={`rounded-lg ${block.attrs.align
                                        ? `mx-${block.attrs.align === "center" ? "auto" : block.attrs.align}`
                                        : ""
                                    } ${block.attrs.className ?? ""}`}
                                width={width}
                                height={height}
                            />
                        )}

                        {block.attrs.caption && (
                            <figcaption className="text-sm text-gray-600 mt-2 text-center">
                                {block.attrs.caption}
                            </figcaption>
                        )}
                    </figure>
                );
            }



            case 'core/video':
                const poster =
                    typeof attrs.poster === "string"
                        ? attrs.poster
                        : undefined;
                const src =
                    typeof attrs.src === "string"
                        ? attrs.src
                        : undefined;

                return (
                    <figure key={index} className="mb-6">
                        <video
                            src={src}
                            controls
                            className="w-full rounded-lg"
                            poster={poster}
                        />
                        {attrs.caption && (
                            <figcaption className="text-sm text-gray-600 mt-2 text-center">
                                {attrs.caption}
                            </figcaption>
                        )}
                    </figure>
                );

            case 'core/separator':
                return <hr key={index} className="my-8 border-t border-gray-300" />;

            case 'core/spacer':
                let height = attrs.height;
                // On ne garde que string ou number, le reste = valeur par défaut
                if (typeof height !== "string" && typeof height !== "number") {
                    height = "50px";
                }
                return (
                    <div
                        key={index}
                        style={{ height: height }}
                        className="block"
                    />
                );

            case 'core/table':
                return (
                    <div key={index} className="overflow-x-auto mb-6">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                            <tbody
                                className="bg-white divide-y divide-gray-200"
                                dangerouslySetInnerHTML={{ __html: innerHTML }}
                            />
                        </table>
                    </div>
                );

            case 'core/buttons':
                return (
                    <div key={index} className="flex flex-wrap gap-3 mb-4">
                        {innerBlocks.map((innerBlock, innerIndex) =>
                            renderBlock(innerBlock, innerIndex)
                        )}
                    </div>
                );

            case 'core/button':
                return (
                    <div
                        key={index}
                        className="inline-block"
                        dangerouslySetInnerHTML={{ __html: innerHTML }}
                    />
                );

            case 'core/columns':
                return (
                    <div key={index} className="grid md:grid-cols-2 gap-6 mb-6">
                        {innerBlocks.map((innerBlock, innerIndex) =>
                            renderBlock(innerBlock, innerIndex)
                        )}
                    </div>
                );

            case 'core/column':
                return (
                    <div key={index} className="flex flex-col">
                        {innerBlocks.map((innerBlock, innerIndex) =>
                            renderBlock(innerBlock, innerIndex)
                        )}
                    </div>
                );

            case 'core/group':
            case 'core/block':
                return (
                    <div key={index} className="mb-4">
                        {innerBlocks.map((innerBlock, innerIndex) =>
                            renderBlock(innerBlock, innerIndex)
                        )}
                    </div>
                );

            case 'core/embed':
            case 'core-embed/youtube':
            case 'core-embed/vimeo':
                // Try to get URL from attrs.url first (WordPress embed block stores it there)
                const embedUrl = innerHTML;
                const youtubeMatch = embedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

                if (youtubeMatch && youtubeMatch[1]) {
                    // It's YouTube, use the YouTubeEmbed component
                    return (
                        <div key={index} className="aspect-video mb-6 max-w-4xl">
                            <YouTubeEmbed videoid={youtubeMatch[1]} height={400} params="rel=0" />
                        </div>
                    );
                }

                // Fallback for other embeds (Vimeo, etc.)
                return (
                    <div key={index} className="aspect-video mb-6">
                        <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
                    </div>
                );
            default:
                // Fallback for unknown blocks
                if (innerHTML) {
                    return (
                        <div
                            key={index}
                            className="mb-4"
                            dangerouslySetInnerHTML={{ __html: innerHTML }}
                        />
                    );
                }
                if (innerBlocks.length > 0) {
                    return (
                        <div key={index} className="mb-4">
                            {innerBlocks.map((innerBlock, innerIndex) =>
                                renderBlock(innerBlock, innerIndex)
                            )}
                        </div>
                    );
                }
                return null;
        }
    };

    return (
        <div className="gutenberg-content">
            {blocks.map((block, index) => renderBlock(block, index))}
        </div>
    );
};

export default GutenbergBlockRenderer;
