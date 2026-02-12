class Opendiff < Formula
  desc "Clean and user-friendly visual terminal diff tool"
  homepage "https://github.com/Pallepadehat/opendiff"
  version "0.1.0"

  on_macos do
    on_arm do
      url "https://github.com/Pallepadehat/opendiff/releases/download/v0.1.0/opendiff-darwin-arm64"
      sha256 "1a0f31fe95277949fae7d0825324390b6705c3764a122a24ece99c017c82d892"
    end
  end

  def install
    binary = Dir["opendiff-*"].first
    raise "No opendiff binary found in downloaded artifact." if binary.nil?

    bin.install binary => "opendiff"
    bin.install_symlink "opendiff" => "vd"
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/opendiff --help")
    assert_match "Usage:", shell_output("#{bin}/vd --help")
  end
end
