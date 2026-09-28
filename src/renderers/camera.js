export function createCameraRenderers(context) {
  function drawDocumentCamera(message = "") {
    const {
      cameraDialog,
      documentCapture,
      ui,
      h,
      button,
      icon,
      courierDocs,
      nextTick,
    } = context();
    ui.cameraError = message;
    const d = cameraDialog(),
      c = documentCapture;
    if (!c) return;
    ui.cameraContent = [
      h(
        "div",
        {
          class: "document-camera-head",
        },
        [
          h(
            "h2",
            {
              id: "document-camera-title",
            },
            ["التقاط المستمسك"],
          ),
          h("div", {}, [
            button(
              "document-flip",
              icon("cameraswitch"),
              'aria-label="تبديل الكاميرا"',
              "camera-icon",
            ),
            button(
              "document-close",
              icon("close"),
              'aria-label="إغلاق الكاميرا"',
              "camera-icon",
            ),
          ]),
        ],
      ),
      h(
        "p",
        {
          class: "camera-document-name",
        },
        [courierDocs[c.key]],
      ),
      h(
        "div",
        {
          class: "document-camera-stage",
        },
        [
          c.photo
            ? h(
                "img",
                {
                  src: c.photo,
                  alt: "معاينة " + courierDocs[c.key],
                },
                [],
              )
            : [
                h(
                  "video",
                  {
                    autoplay: true,
                    muted: true,
                    playsinline: true,
                    "aria-label": "معاينة الكاميرا",
                  },
                  [],
                ),
                h(
                  "div",
                  {
                    class: "document-frame",
                    "aria-hidden": "true",
                  },
                  [],
                ),
              ],
        ],
      ),
      h(
        "p",
        {
          class: "camera-tip",
        },
        [icon("light_mode"), " اجعل المستمسك كاملاً داخل الإطار بإضاءة جيدة"],
      ),
      h(
        "p",
        {
          class: "camera-error",
          role: "alert",
        },
        [message],
      ),
      h(
        "div",
        {
          class: "camera-actions",
        },
        [
          c.photo
            ? [
                button(
                  "document-save",
                  ["اعتماد الصورة ", icon("check")],
                  "",
                  "camera-primary",
                ),
                button(
                  "document-retake",
                  "إعادة التصوير",
                  "",
                  "camera-secondary",
                ),
              ]
            : button(
                "document-start",
                ["فتح الكاميرا ", icon("photo_camera")],
                "",
                "camera-primary",
              ),
        ],
      ),
      h(
        "label",
        {
          class: "camera-upload",
        },
        [
          "اختيار صورة من الجهاز",
          h(
            "input",
            {
              type: "file",
              accept: "image/jpeg,image/png,image/webp",
              "data-camera-upload": "",
              "aria-label": "اختيار صورة المستمسك من الجهاز",
            },
            [],
          ),
        ],
      ),
    ];
    nextTick(() => {
      if (!d.open) d.showModal();
    });
  }
  function reviewCourierRegistration() {
    const {
      gatherCourier,
      state,
      courierDocs,
      modal,
      row,
      vehicleNames,
      h,
      button,
    } = context();
    gatherCourier();
    const r = state.registration;
    if (r.password !== r.confirmPassword)
      throw Error("كلمة المرور وتأكيدها غير متطابقين");
    for (const [key, label] of Object.entries(courierDocs))
      if (!r.documents[key]) throw Error("أضف صورة " + label);
    modal("مراجعة حساب المندوب", [
      row("الاسم", r.name),
      row("الهاتف", r.phone),
      row("المركبة", vehicleNames[r.vehicle]),
      row("اللوحة", r.plate),
      row("العنوان", r.province + " — " + r.area + " — " + r.address),
      h(
        "div",
        {
          class: "courier-review-docs",
        },
        [
          Object.entries(courierDocs).map(([key, label]) =>
            h("figure", {}, [
              h(
                "img",
                {
                  src: r.documents[key],
                  alt: label,
                },
                [],
              ),
              h("figcaption", {}, [label]),
            ]),
          ),
        ],
      ),
      h(
        "div",
        {
          class: "camera-actions",
        },
        [
          button("courier-confirm", "إنشاء الحساب", "", "primary-button"),
          button("courier-edit", "تعديل البيانات", "", "secondary-button"),
        ],
      ),
    ]);
  }
  return {
    drawDocumentCamera,
    reviewCourierRegistration,
  };
}
