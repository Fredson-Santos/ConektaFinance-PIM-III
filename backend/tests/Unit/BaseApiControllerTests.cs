using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PIM_III_Backend.Controllers;

namespace PIM_III_Backend.Tests.Unit;

public class BaseApiControllerTests
{
    private class StubController : BaseApiController
    {
        public int ExposeCurrentUserId() => CurrentUserId;
    }

    private static StubController BuildController(IEnumerable<Claim> claims)
    {
        var identity = new ClaimsIdentity(claims, "Test");
        return new StubController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            }
        };
    }

    [Fact]
    public void CurrentUserId_retorna_id_a_partir_do_claim_sub()
    {
        var controller = BuildController(new[] { new Claim("sub", "42") });
        controller.ExposeCurrentUserId().Should().Be(42);
    }

    [Fact]
    public void CurrentUserId_retorna_id_a_partir_do_claim_nameidentifier_quando_nao_ha_sub()
    {
        var controller = BuildController(new[] { new Claim(ClaimTypes.NameIdentifier, "7") });
        controller.ExposeCurrentUserId().Should().Be(7);
    }

    [Fact]
    public void CurrentUserId_sem_claim_valido_lanca_acesso_negado()
    {
        var controller = BuildController(Array.Empty<Claim>());
        var act = () => controller.ExposeCurrentUserId();
        act.Should().Throw<UnauthorizedAccessException>();
    }

    [Fact]
    public void CurrentUserId_com_claim_nao_numerico_lanca_acesso_negado()
    {
        var controller = BuildController(new[] { new Claim("sub", "abc") });
        var act = () => controller.ExposeCurrentUserId();
        act.Should().Throw<UnauthorizedAccessException>();
    }
}
