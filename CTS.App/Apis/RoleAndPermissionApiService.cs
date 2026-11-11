using CTS.Shared;
using CTS.Shared.Features.RoleAndPermission;

namespace CTS.App.Apis;

public sealed class RoleAndPermissionApiService(ApiService transport)
{
    public Task<Result<RolePermissionListResponseModel>> ListAsync(CancellationToken cancellationToken = default) =>
        transport.PostAsync<RolePermissionListRequestModel, RolePermissionListResponseModel>("role-permission/list", new(), cancellationToken: cancellationToken);

    public Task<Result<RolePermissionUpdateResponseModel>> UpdateAsync(RolePermissionUpdateRequestModel request, CancellationToken cancellationToken = default) =>
        transport.PostAsync<RolePermissionUpdateRequestModel, RolePermissionUpdateResponseModel>("role-permission/update", request, cancellationToken: cancellationToken);

    public Task<Result<RolePermissionMatrixUpdateResponseModel>> UpdateMatrixAsync(RolePermissionMatrixUpdateRequestModel request, CancellationToken cancellationToken = default) =>
        transport.PostAsync<RolePermissionMatrixUpdateRequestModel, RolePermissionMatrixUpdateResponseModel>("role-permission/matrix-update", request, cancellationToken: cancellationToken);
}
