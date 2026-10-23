fn main() {
    #[cfg(windows)]
    {
        let mut resource = winres::WindowsResource::new();
        resource.set_icon("assets/icon.ico");
        resource.set("ProductName", "OpenPDF Studio");
        resource.set("FileDescription", "Native OpenPDF Studio desktop app");
        resource.set("CompanyName", "OpenPDF Studio");
        resource.set("LegalCopyright", "MIT licensed");
        resource.compile().expect("failed to compile Windows resources");
    }
}
