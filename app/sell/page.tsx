"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getStorageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName === "jpeg" || fromName === "jpg") return "jpg";
  if (fromName === "png") return "png";
  if (fromName === "webp") return "webp";

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

/** Supabase Storage keys: no spaces or special chars in the filename segment. */
function buildStorageFilePath(userId: string, index: number, file: File): string {
  const ext = getStorageExtension(file);
  return `${userId}/${Date.now()}-${index}-image.${ext}`;
}

export default function SellPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Like New");
  const [whatsapp, setWhatsapp] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState("VIT Student");
  const [sellerAvatar, setSellerAvatar] = useState("V");
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?next=/sell");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name,avatar_letter")
        .eq("id", user.id)
        .maybeSingle();

      const displayName =
        profile?.display_name?.trim() ||
        user.email?.split("@")[0]?.trim() ||
        "VIT Student";
      const avatarLetter =
        profile?.avatar_letter?.trim()?.charAt(0)?.toUpperCase() ||
        displayName.charAt(0)?.toUpperCase() ||
        "V";

      setSellerName(displayName);
      setSellerAvatar(avatarLetter);
    }

    void loadUser();
  }, [router]);

  function validateIncomingFiles(incoming: File[]) {
    if (incoming.length === 0) return [];

    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: only JPG, PNG, WEBP supported.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name}: file must be <= ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setUploadError(errors.join(" "));
    } else {
      setUploadError(null);
    }

    return validFiles;
  }

  function addFiles(incoming: File[]) {
    const validated = validateIncomingFiles(incoming);
    if (validated.length === 0) return;

    setFiles((prev) => {
      const combined = [...prev, ...validated];
      if (combined.length > MAX_FILES) {
        setUploadError(`You can upload maximum ${MAX_FILES} images.`);
      }
      return combined.slice(0, MAX_FILES);
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !userId) {
      setStatus("Please add at least one image and login again.");
      return;
    }

    setLoading(true);
    setStatus("Uploading images...");

    const supabase = getSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const filePath = buildStorageFilePath(userId, i, file);

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setLoading(false);
        setStatus(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
      setStatus(`Uploaded ${i + 1}/${files.length} image(s)...`);
    }

    setStatus("Saving product...");

    const { error: insertError } = await supabase.from("products").insert({
      title,
      description,
      price: Number(price),
      category,
      location,
      condition,
      whatsapp,
      image_url: uploadedUrls[0],
      image_urls: uploadedUrls,
      seller_id: userId,
      seller_name: sellerName,
      seller_avatar: sellerAvatar,
      tags: [category.toLowerCase()],
      is_sold: false,
    });

    if (insertError) {
      setLoading(false);
      setStatus(insertError.message);
      return;
    }

    setStatus("Product listed successfully!");
    setTitle("");
    setPrice("");
    setCategory("");
    setDescription("");
    setLocation("");
    setCondition("Like New");
    setWhatsapp("");
    setFiles([]);
    setUploadError(null);
    setLoading(false);
  }

  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1e293b 0%, #0a0a0a 40%)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "#111111",
          border: "1px solid #27272a",
          borderRadius: "32px",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "54px",
            fontWeight: "900",
            marginBottom: "10px",
          }}
        >
          Sell an Item
        </h1>

        <p
          style={{
            color: "#888",
            marginBottom: "40px",
            fontSize: "18px",
          }}
        >
          List your product for VIT students
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
          }}
        >
          <input
            type="text"
            placeholder="Product Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Location (e.g. AB1 Block)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />

          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            style={inputStyle}
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>

          <input
            type="text"
            placeholder="WhatsApp Number"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            style={inputStyle}
          />

          <div
            style={{
              ...dropzoneStyle,
              ...(dragActive ? dropzoneActiveStyle : {}),
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              addFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
              Drag and drop images here
            </p>
            <p style={{ margin: "0 0 12px", color: "#a1a1aa", fontSize: "13px" }}>
              JPG, PNG, WEBP | Max {MAX_FILES} files | Max {MAX_FILE_SIZE_MB}MB each
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
              style={fileInputStyle}
            />
          </div>

          {files.length > 0 ? (
            <div style={previewGridStyle}>
              {previews.map((preview, index) => (
                <div key={`${preview.name}-${index}`} style={previewCardStyle}>
                  <img src={preview.url} alt={preview.name} style={previewImageStyle} />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {uploadError ? (
            <p style={{ margin: 0, color: "#fca5a5", fontSize: "13px" }}>{uploadError}</p>
          ) : null}

          {status ? (
            <p style={{ margin: 0, color: "#a1a1aa", fontSize: "14px" }}>{status}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "18px",
              borderRadius: "18px",
              fontSize: "18px",
              fontWeight: "bold",
              marginTop: "10px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Submitting..." : "List Product"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  background: "#18181b",
  border: "1px solid #27272a",
  padding: "18px",
  borderRadius: "16px",
  color: "white",
  fontSize: "16px",
  outline: "none",
} as const;

const dropzoneStyle: React.CSSProperties = {
  background: "rgba(24,24,27,0.75)",
  border: "1px dashed #3f3f46",
  padding: "18px",
  borderRadius: "16px",
  textAlign: "center",
  transition: "all 180ms ease",
};

const dropzoneActiveStyle: React.CSSProperties = {
  borderColor: "#60a5fa",
  boxShadow: "0 0 0 1px rgba(96,165,250,0.45)",
};

const fileInputStyle: React.CSSProperties = {
  width: "100%",
  color: "#d4d4d8",
};

const previewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "10px",
};

const previewCardStyle: React.CSSProperties = {
  border: "1px solid #27272a",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#0f0f12",
};

const previewImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100px",
  objectFit: "cover",
  display: "block",
};

const removeButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderTop: "1px solid #27272a",
  background: "#18181b",
  color: "#fca5a5",
  padding: "8px",
  fontSize: "12px",
  cursor: "pointer",
};