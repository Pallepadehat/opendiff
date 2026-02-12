class Opendiff < Formula
  desc "Clean and user-friendly visual terminal diff tool"
  homepage "https://github.com/<owner>/opendiff"
  version "0.1.0"

  on_macos do
    on_arm do
      url "https://github.com/<owner>/opendiff/releases/download/v0.1.0/opendiff-darwin-arm64"
      sha256 "REPLACE_WITH_DARWIN_ARM64_SHA256"
    end
  end

  on_linux do
    on_intel do
      url "https://github.com/<owner>/opendiff/releases/download/v0.1.0/opendiff-linux-x64"
      sha256 "REPLACE_WITH_LINUX_X64_SHA256"
    end
  end

  def install
    bin.install Dir["opendiff-*"].first => "opendiff"
    bin.install_symlink "opendiff" => "vd"
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/opendiff --help")
    assert_match "Usage:", shell_output("#{bin}/vd --help")
  end
end
