export function createAuthRenderers(context) {
  function authView(error = "") {
    const { h, icon, roleNames, state, button, input } = context();
    const brand = h(
      "div",
      {
        class: "entry-brand",
      },
      [
        h(
          "span",
          {
            class: "auth-logo-art",
            role: "img",
            "aria-label": "شعار واصل",
          },
          [],
        ),
        h("strong", {}, ["واصل"]),
        h("span", {}, ["ALWASIL · FOR DELIVERY"]),
      ],
    );
    const roles = [
      h(
        "div",
        {
          class: "entry-intro",
        },
        [
          h(
            "span",
            {
              class: "entry-kicker",
            },
            ["كل مشوار يبدأ بخطوة"],
          ),
          h("h1", {}, ["حيّاك بواصل"]),
          h("p", {}, ["اختار حسابك، وخلّي الباقي علينا."]),
        ],
      ),
      h(
        "div",
        {
          class: "glass-role-grid",
        },
        [
          ["merchant", "courier"].map((r) =>
            h(
              "button",
              {
                type: "button",
                class: "glass-role " + r,
                "data-action": "choose-role",
                "data-role": r,
              },
              [
                h(
                  "span",
                  {
                    class: "glass-role-icon",
                  },
                  [icon(r === "merchant" ? "storefront" : "two_wheeler")],
                ),
                h("strong", {}, [roleNames[r]]),
                h(
                  "span",
                  {
                    class: "role-description",
                  },
                  [
                    r === "merchant"
                      ? "طلباتك بيد أمينة"
                      : "كل مشوار، فرصة جديدة",
                  ],
                ),
                h(
                  "span",
                  {
                    class: "role-enter",
                  },
                  ["دخول ", roleNames[r], " ", icon("arrow_back")],
                ),
              ],
            ),
          ),
        ],
      ),
      h(
        "div",
        {
          class: "entry-promise",
        },
        [
          h("span", {}, [icon("bolt"), "سهل وسريع"]),
          h("span", {}, [icon("route"), "معك بكل خطوة"]),
        ],
      ),
    ];
    const form = state.authRole
      ? h(
          "section",
          {
            class: "glass-login",
            "aria-labelledby": "login-title",
          },
          [
            button(
              "choose-again",
              [icon("arrow_forward"), " تغيير نوع الحساب"],
              "",
              "entry-back",
            ),
            h(
              "div",
              {
                class: "selected-role-icon " + state.authRole,
              },
              [
                icon(
                  state.authRole === "merchant" ? "storefront" : "two_wheeler",
                ),
              ],
            ),
            h(
              "span",
              {
                class: "entry-kicker",
              },
              ["حساب ", roleNames[state.authRole]],
            ),
            h(
              "h1",
              {
                id: "login-title",
              },
              ["نورتنا من جديد"],
            ),
            h(
              "p",
              {
                class: "login-subtitle",
              },
              ["أدخل بياناتك وابدأ مشوارك."],
            ),
            h(
              "form",
              {
                id: "login-form",
                novalidate: true,
                class: "form-stack",
              },
              [
                h(
                  "input",
                  {
                    type: "hidden",
                    name: "role",
                    value: state.authRole,
                  },
                  [],
                ),
                input(
                  "phone",
                  "رقم الهاتف",
                  "",
                  'type="tel" dir="ltr" inputmode="tel" autocomplete="username" placeholder="077xxxxxxxx"',
                ),
                h(
                  "div",
                  {
                    class: "login-password",
                  },
                  [
                    input(
                      "password",
                      "كلمة المرور",
                      "",
                      'type="password" autocomplete="current-password" placeholder="أدخل كلمة المرور"',
                    ),
                    button(
                      "toggle-password",
                      icon("visibility"),
                      'aria-label="إظهار كلمة المرور" aria-pressed="false"',
                      "password-toggle",
                    ),
                  ],
                ),
                h(
                  "p",
                  {
                    class: "inline-error",
                    role: "alert",
                  },
                  [error],
                ),
                h(
                  "button",
                  {
                    class: "login-submit",
                    type: "submit",
                  },
                  ["تسجيل الدخول ", icon("arrow_back")],
                ),
              ],
            ),
            h(
              "p",
              {
                class: "login-create",
              },
              [
                "أول مرة ويانا؟ ",
                button("register", "أنشئ حسابك", "", "auth-text-button"),
              ],
            ),
          ],
        )
      : "";
    return h(
      "div",
      {
        class: "glass-entry " + (state.authRole ? "is-login" : ""),
      },
      [
        h(
          "div",
          {
            class: "glass-orb orb-blue",
            "aria-hidden": "true",
          },
          [],
        ),
        h(
          "div",
          {
            class: "glass-orb orb-orange",
            "aria-hidden": "true",
          },
          [],
        ),
        h(
          "div",
          {
            class: "entry-content",
          },
          [
            brand,
            state.authRole ? form : roles,
            h(
              "p",
              {
                class: "entry-signature",
              },
              ["توصيل أسرع… لحياة أسهل"],
            ),
          ],
        ),
      ],
    );
    window.scrollTo(0, 0);
  }
  function merchantRegistrationView() {
    const {
      state,
      courierView,
      select,
      input,
      h,
      vehicleNames,
      provinces,
      coords,
      row,
      roleNames,
      stepper,
      button,
    } = context();
    if (state.registration.role === "courier") return courierView();
    const r = state.registration;
    let fields = "";
    if (r.step === 0)
      fields = [
        select(
          "role",
          "نوع الحساب",
          {
            merchant: "تاجر",
            courier: "مندوب",
          },
          r.role,
        ),
        input("name", "الاسم / اسم النشاط", r.name, 'required maxlength="80"'),
        input(
          "phone",
          "رقم الهاتف",
          r.phone,
          'type="tel" required dir="ltr" placeholder="077xxxxxxxx"',
        ),
        input(
          "password",
          "كلمة المرور",
          r.password,
          'type="password" required minlength="8" autocomplete="new-password"',
        ),
        h(
          "p",
          {
            class: "file-help",
          },
          ["الأرقام المسموحة077 و078 و079. يمكن استخدام صيغة +964 أيضاً."],
        ),
      ];
    else if (r.step === 1)
      fields = [
        r.role === "merchant"
          ? select(
              "activity",
              "نوع النشاط",
              {
                shop: "محل",
                warehouse: "مخزن",
                ecommerce: "تجارة إلكترونية — قريباً",
              },
              r.activity,
            )
          : r.role === "courier"
            ? [
                select("vehicle", "نوع المركبة", vehicleNames, r.vehicle),
                input(
                  "plate",
                  "رقم المركبة",
                  r.plate,
                  'required maxlength="40"',
                ),
              ]
            : "",
        select(
          "province",
          "المحافظة",
          Object.fromEntries(provinces.map((p) => [p, p])),
          r.province,
        ),
        input("area", "المنطقة", r.area, "required"),
        input("address", "العنوان", r.address, "required"),
      ];
    else if (r.step === 2)
      fields = [
        coords(r.location),
        r.role === "merchant"
          ? [
              h("label", {}, [
                "صورة المحل من الداخل",
                h(
                  "input",
                  {
                    type: "file",
                    name: "inside",
                    accept: "image/*",
                    required: true,
                  },
                  [],
                ),
              ]),
              h("label", {}, [
                "صورة المحل من الخارج",
                h(
                  "input",
                  {
                    type: "file",
                    name: "outside",
                    accept: "image/*",
                    required: true,
                  },
                  [],
                ),
              ]),
            ]
          : r.role === "courier"
            ? h("label", {}, [
                "الصورة الشخصية",
                h(
                  "input",
                  {
                    name: "inside",
                    type: "file",
                    accept: "image/*",
                    required: true,
                  },
                  [],
                ),
              ])
            : "",
      ];
    else
      fields = [
        row("الاسم", r.name),
        row("الهاتف", r.phone),
        row("الدور", roleNames[r.role]),
        row("العنوان", r.province + " — " + r.area + " — " + r.address),
        h(
          "div",
          {
            class: "photo-preview",
          },
          [
            r.photos.map((p) =>
              h(
                "img",
                {
                  alt: "صورة التسجيل",
                  src: p,
                },
                [],
              ),
            ),
          ],
        ),
        h(
          "p",
          {
            class: "status-note blue",
          },
          [
            "يصبح الحساب جاهزاً بعد إكمال التسجيل. التحقق الآلي عبر SMS غير مربوط في النسخة المحلية.",
          ],
        ),
      ];
    return h(
      "section",
      {
        class: "surface wizard",
      },
      [
        stepper(r.step, ["الأساسيات", "النشاط", "الصور والموقع", "المراجعة"]),
        h(
          "form",
          {
            id: "register-form",
            class: "form-stack",
          },
          [
            fields,
            h(
              "p",
              {
                class: "inline-error",
              },
              [],
            ),
            h(
              "div",
              {
                class: "wizard-footer",
              },
              [
                r.step
                  ? button("register-back", "السابق")
                  : button("login-page", "رجوع"),
                h(
                  "button",
                  {
                    class: "primary-button",
                  },
                  [r.step === 3 ? "إنشاء الحساب" : "التالي"],
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
  function courierView() {
    const {
      state,
      h,
      icon,
      mergeProps,
      attributes,
      button,
      courierDocs,
      provinces,
      vehicleNames,
      coords,
    } = context();
    state.registration.documents ??= {};
    const r = state.registration;
    const field = (name, label, ic, type = "text", extra = "") =>
      h(
        "label",
        {
          class: "courier-field",
        },
        [
          label,
          h(
            "span",
            {
              class: "courier-input",
            },
            [
              icon(ic),
              h(
                "input",
                mergeProps(
                  {
                    name: name,
                    type: type,
                    value: r[name] || "",
                    placeholder: label,
                    required: true,
                  },
                  attributes(extra),
                ),
                [],
              ),
            ],
          ),
        ],
      );
    const password = (name, label) =>
      h(
        "label",
        {
          class: "courier-field",
        },
        [
          label,
          h(
            "span",
            {
              class: "courier-input",
            },
            [
              icon("lock"),
              h(
                "input",
                {
                  name: name,
                  type: "password",
                  value: r[name] || "",
                  placeholder: label,
                  minlength: "8",
                  required: true,
                  autocomplete: "new-password",
                },
                [],
              ),
              button(
                "courier-password",
                "إظهار",
                {
                  "data-field": name,
                  "aria-label": "إظهار " + label,
                  "aria-pressed": "false",
                },
                "courier-password-button",
              ),
            ],
          ),
        ],
      );
    const doc = (key) =>
      h(
        "div",
        {
          class: "document-slot " + (r.documents[key] ? "has-photo" : ""),
        },
        [
          r.documents[key]
            ? h(
                "img",
                {
                  src: r.documents[key],
                  alt: courierDocs[key],
                  class: "document-thumbnail",
                },
                [],
              )
            : icon("add_a_photo"),
          h("span", {}, [courierDocs[key]]),
          button(
            "document-open",
            r.documents[key]
              ? "معاينة أو إعادة التصوير"
              : "التقط صورة المستمسك",
            `data-document="${key}"`,
            "document-trigger",
          ),
          h(
            "label",
            {
              class: "document-upload",
            },
            [
              "أو اختر صورة",
              h(
                "input",
                {
                  type: "file",
                  accept: "image/jpeg,image/png,image/webp",
                  "data-document-upload": key,
                  "aria-label": "اختيار صورة " + courierDocs[key],
                },
                [],
              ),
            ],
          ),
        ],
      );
    return h(
      "section",
      {
        class: "courier-registration",
      },
      [
        h(
          "div",
          {
            class: "courier-registration-inner",
          },
          [
            h(
              "header",
              {
                class: "courier-registration-header",
              },
              [
                button(
                  "login-page",
                  [icon("arrow_forward"), " رجوع"],
                  "",
                  "courier-back",
                ),
                h(
                  "span",
                  {
                    class: "auth-logo-art",
                    role: "img",
                    "aria-label": "شعار واصل",
                  },
                  [],
                ),
                h("h1", {}, ["حساب المندوب"]),
                h("p", {}, ["أدخل بياناتك الشخصية ووسيلة التوصيل"]),
              ],
            ),
            h(
              "form",
              {
                id: "courier-register-form",
                class: "courier-glass",
              },
              [
                h(
                  "input",
                  {
                    type: "hidden",
                    name: "role",
                    value: "courier",
                  },
                  [],
                ),
                field(
                  "name",
                  "الاسم الكامل",
                  "person",
                  "text",
                  'autocomplete="name" maxlength="80"',
                ),
                field(
                  "address",
                  "العنوان",
                  "location_on",
                  "text",
                  'autocomplete="street-address" maxlength="200"',
                ),
                h(
                  "label",
                  {
                    class: "courier-field",
                  },
                  [
                    "المحافظة",
                    h(
                      "span",
                      {
                        class: "courier-input",
                      },
                      [
                        icon("map"),
                        h(
                          "select",
                          {
                            name: "province",
                            required: true,
                          },
                          [
                            provinces.map((p) =>
                              h(
                                "option",
                                mergeProps(
                                  {},
                                  attributes(
                                    r.province === p ? "selected" : "",
                                  ),
                                ),
                                [p],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                field("area", "المنطقة", "near_me", "text", 'maxlength="80"'),
                field(
                  "phone",
                  "رقم الهاتف",
                  "call",
                  "tel",
                  'dir="ltr" inputmode="tel" autocomplete="tel" maxlength="20"',
                ),
                password("password", "كلمة المرور"),
                password("confirmPassword", "تأكيد كلمة المرور"),
                h(
                  "div",
                  {
                    class: "courier-divider",
                  },
                  [h("span", {}, ["وسيلة التوصيل · الوثائق"])],
                ),
                h(
                  "fieldset",
                  {
                    class: "vehicle-fieldset",
                  },
                  [
                    h("legend", {}, ["وسيلة التوصيل"]),
                    h(
                      "div",
                      {
                        class: "courier-vehicles",
                      },
                      [
                        Object.entries(vehicleNames).map(([v, label]) =>
                          h(
                            "label",
                            {
                              class: "courier-vehicle",
                            },
                            [
                              h(
                                "input",
                                mergeProps(
                                  {
                                    type: "radio",
                                    name: "vehicle",
                                    value: v,
                                    required: true,
                                  },
                                  attributes(r.vehicle === v ? "checked" : ""),
                                ),
                                [],
                              ),
                              h(
                                "span",
                                {
                                  class: "vehicle-icon",
                                },
                                [
                                  icon(
                                    {
                                      motorcycle: "two_wheeler",
                                      sedan: "directions_car",
                                      truck: "local_shipping",
                                      refrigerated: "ac_unit",
                                    }[v],
                                  ),
                                ],
                              ),
                              h("strong", {}, [label]),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                field(
                  "plate",
                  "رقم لوحة المركبة",
                  "pin",
                  "text",
                  'maxlength="40"',
                ),
                h(
                  "h2",
                  {
                    class: "document-heading",
                  },
                  ["بطاقة السكن"],
                ),
                h(
                  "div",
                  {
                    class: "document-grid single",
                  },
                  [doc("residenceFront")],
                ),
                h(
                  "h2",
                  {
                    class: "document-heading",
                  },
                  ["البطاقة الوطنية"],
                ),
                h(
                  "div",
                  {
                    class: "document-grid",
                  },
                  [doc("nationalFront"), doc("nationalBack")],
                ),
                h(
                  "h2",
                  {
                    class: "document-heading",
                  },
                  ["إجازة السوق"],
                ),
                h(
                  "div",
                  {
                    class: "document-grid",
                  },
                  [doc("licenseFront"), doc("licenseBack")],
                ),
                h(
                  "div",
                  {
                    class: "courier-divider",
                  },
                  [h("span", {}, ["موقع الانطلاق"])],
                ),
                h(
                  "p",
                  {
                    class: "courier-help",
                  },
                  ["حدّد موقعك ليظهر لك الطلب المناسب والقريب."],
                ),
                h(
                  "div",
                  {
                    class: "courier-location",
                  },
                  [coords(r.location)],
                ),
                h(
                  "p",
                  {
                    class: "inline-error",
                    id: "courier-error",
                    role: "alert",
                  },
                  [],
                ),
                h(
                  "button",
                  {
                    class: "courier-create",
                    type: "submit",
                  },
                  ["مراجعة البيانات ", icon("arrow_back")],
                ),
                h(
                  "p",
                  {
                    class: "courier-help",
                  },
                  [
                    "تُحفظ المستمسكات ضمن حسابك ولا تظهر للتجار أو المناديب الآخرين.",
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
  return {
    authView,
    merchantRegistrationView,
    courierView,
  };
}
