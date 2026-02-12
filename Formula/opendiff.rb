class Opendiff < Formula
  desc "Clean and user-friendly visual terminal diff tool"
  homepage "https://github.com/Pallepadehat/opendiff"
  version "0.1.1"

  on_macos do
    on_arm do
      url "https://github.com/Pallepadehat/opendiff/releases/download/v0.1.1/opendiff-darwin-arm64"
      sha256 "4ca6f5b191589d9cb1bbd90a84673cf74cf84d91c5c8f0fecf96f1dc17ecd802"
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
