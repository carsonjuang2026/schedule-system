document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const currentPath = params.get("path") || "";

    document.getElementById("folderPath").innerText = currentPath;

    loadItems(currentPath);

    // 上傳按鈕
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");

    if (uploadBtn) {
        uploadBtn.addEventListener("click", async () => {
            const file = fileInput.files[0];
            if (!file) {
                alert("請先選擇檔案");
                return;
            }

            let formData = new FormData();
            formData.append("file", file);
            formData.append("path", currentPath);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });

                const result = await res.json();

                if (result.success) {
                    alert("上傳成功");
                    location.reload();
                } else {
                    alert("上傳失敗：" + (result.error || "伺服器回傳錯誤"));
                }
            } catch (err) {
                alert("上傳失敗（程式錯誤）");
                console.error("Upload error:", err);
            }
        });
    }
});

async function loadItems(path) {
    const res = await fetch(`/api/list?path=${encodeURIComponent(path)}`);
    const list = await res.json();

    const container = document.getElementById("listContainer");
    container.innerHTML = "";

    list.forEach((item) => {
        let div = document.createElement("div");
        div.className = "item";

        if (item.type === "folder") {
            div.innerHTML = `📁 <a href="folder.html?path=${encodeURIComponent(path + "/" + item.name)}">${item.name}</a>`;
        } else {
            div.innerHTML = `📄 <a href="${path}/${item.name}" download>${item.name}</a>`;
        }

        container.appendChild(div);
    });
}
